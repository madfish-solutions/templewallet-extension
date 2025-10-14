import React, { memo, useCallback, useMemo } from 'react';

import { AssetPosition, ExchangeClient } from '@nktkas/hyperliquid';
import BigNumber from 'bignumber.js';
import clsx from 'clsx';
import { capitalize } from 'lodash';

import { TextButton } from 'app/atoms/TextButton';
import { toastError, toastSuccess } from 'app/toaster';

import { useClients } from '../clients';
import { useFeesStats } from '../fees-stats-provider';
import { ScrollableTable } from '../scrollable-table';
import { PerpTradePair } from '../types';
import { BUILDER_ADDRESS, BUILDER_FEE_UNITS, formatPrice } from '../utils';

import { DollarValue } from './dollar-value';
import { PnlView } from './pnl-view';

interface PositionsViewProps {
  positions: AssetPosition[];
  perpPairsByCoinName: StringRecord<PerpTradePair>;
}

const positionsColumns = [
  'Coin',
  'Size',
  'Position Value',
  'Entry Price',
  'Mark Price',
  'PNL',
  'Liq. price',
  'Margin',
  'Funding',
  ''
].map(columnName => (
  <span className="whitespace-nowrap" key={columnName}>
    {columnName}
  </span>
));

export const PositionsView = memo<PositionsViewProps>(({ positions, perpPairsByCoinName }) => {
  const {
    clients: { exchange }
  } = useClients();

  const rows = useMemo(() => {
    return positions.map(({ position }, index) => {
      const {
        coin,
        szi: rawSzi,
        positionValue,
        entryPx,
        liquidationPx,
        unrealizedPnl,
        marginUsed,
        cumFunding,
        returnOnEquity,
        leverage,
        maxLeverage
      } = position;
      const szi = new BigNumber(rawSzi);

      return {
        key: index,
        cells: [
          { children: `${coin} (${maxLeverage}x)`, className: 'whitespace-nowrap' },
          {
            children: `${szi.abs().toFixed()} ${coin}`,
            className: clsx(szi.gt(0) ? 'text-success' : 'text-error', 'whitespace-nowrap')
          },
          { children: <DollarValue>{positionValue}</DollarValue> },
          { children: formatPrice(new BigNumber(entryPx)) },
          { children: perpPairsByCoinName[coin].markPx },
          { children: <PnlView value={new BigNumber(unrealizedPnl)} pnlRate={new BigNumber(returnOnEquity)} /> },
          { children: liquidationPx ? formatPrice(new BigNumber(liquidationPx)) : '-' },
          {
            children: (
              <>
                <DollarValue>{marginUsed}</DollarValue> ({capitalize(leverage.type)})
              </>
            ),
            className: 'whitespace-nowrap'
          },
          { children: <DollarValue>{new BigNumber(cumFunding.sinceOpen).negated()}</DollarValue> },
          {
            children: exchange ? (
              <ClosePositionButton position={position} exchangeClient={exchange} pair={perpPairsByCoinName[coin]} />
            ) : null
          }
        ]
      };
    });
  }, [exchange, perpPairsByCoinName, positions]);

  return <ScrollableTable className="h-32 text-font-description" columns={positionsColumns} rows={rows} />;
});

interface ClosePositionButtonProps {
  position: AssetPosition['position'];
  exchangeClient: ExchangeClient;
  pair: PerpTradePair;
}

const ClosePositionButton = memo<ClosePositionButtonProps>(({ position, exchangeClient, pair }) => {
  const { szi: rawSzi } = position;
  const { index: pairIndex, markPx } = pair;
  const { approvalIsSufficient, updateFees } = useFeesStats();

  const handleClosePositionClick = useCallback(async () => {
    const szi = new BigNumber(rawSzi);

    try {
      const isBuy = szi.lt(0);
      const result = await exchangeClient.order({
        orders: [
          {
            a: pairIndex,
            b: isBuy,
            p: formatPrice(new BigNumber(markPx).times(isBuy ? '1.01' : '0.99')),
            s: szi.abs().toFixed(),
            t: { limit: { tif: 'FrontendMarket' } },
            r: true
          }
        ],
        grouping: 'na',
        builder: {
          b: BUILDER_ADDRESS,
          f: BUILDER_FEE_UNITS
        }
      });
      const status = result.response.data.statuses[0];
      toastSuccess(
        `Placed order ${'resting' in status ? status.resting.oid : status.filled.oid} for closing the position`
      );
    } catch (e) {
      console.error(e);
      toastError('Failed to close position');
    }
  }, [exchangeClient, markPx, pairIndex, rawSzi]);
  const handleApproveClick = useCallback(async () => {
    try {
      await exchangeClient.approveBuilderFee({ builder: BUILDER_ADDRESS, maxFeeRate: `${BUILDER_FEE_UNITS / 1e3}%` });
      await updateFees();
      toastSuccess('Builder fee approval successful');
    } catch (e) {
      console.error(e);
      toastError('Failed to approve builder fee');
    }
  }, [exchangeClient, updateFees]);

  return (
    <TextButton
      color="grey"
      onClick={approvalIsSufficient ? handleClosePositionClick : handleApproveClick}
      className="whitespace-nowrap"
    >
      {approvalIsSufficient ? 'Close position' : 'Approve builder fee'}
    </TextButton>
  );
});
