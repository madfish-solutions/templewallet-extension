import React, { memo, useCallback, useMemo } from 'react';

import { ExchangeClient, PerpsClearinghouseState, SpotClearinghouseState } from '@nktkas/hyperliquid';
import BigNumber from 'bignumber.js';
import clsx from 'clsx';
import { noop } from 'lodash';

import { HashChip } from 'app/atoms/HashChip';
import { atomsToTokens } from 'lib/temple/helpers';

import { ScrollableTable, TableRow } from '../../scrollable-table';
import { SpotTradePair } from '../../types';
import { DollarValue } from '../dollar-value';
import { PnlView } from '../pnl-view';

import { SendAssetButton } from './send-asset-button';
import { TransferUsdcButton } from './transfer-usdc-button';

const actionsColumns = ['Send', 'Transfer'];
const balancesColumns = [
  'Coin',
  'Total Balance',
  'Available Balance',
  'USDC Value',
  'PNL',
  'Send',
  'Transfer',
  'Contract'
].map(columnName => (
  <span className={clsx('whitespace-nowrap', actionsColumns.includes(columnName) && 'px-1')} key={columnName}>
    {columnName}
  </span>
));

interface BalancesViewProps {
  spotState: SpotClearinghouseState;
  perpsState: PerpsClearinghouseState;
  spotUsdcPairsByCoinIndex: StringRecord<SpotTradePair>;
  lastPrices: StringRecord;
}

export const BalancesView = memo<BalancesViewProps>(
  ({ spotState, perpsState, spotUsdcPairsByCoinIndex, lastPrices }) => {
    const rows = useMemo(() => {
      const usdcSpotBalance = spotState.balances.find(balance => balance.coin === 'USDC');
      const nonUsdcSpotBalances = spotState.balances.filter(balance => balance.coin !== 'USDC');

      let result: TableRow[] = [];
      if (usdcSpotBalance) {
        const { total, hold } = usdcSpotBalance;
        result.push({
          key: 'USDC (Spot)',
          cells: [
            { children: 'USDC (Spot)', className: 'whitespace-nowrap' },
            { children: `${total} USDC`, className: 'whitespace-nowrap' },
            { children: `${new BigNumber(total).minus(hold).toFixed()} USDC`, className: 'whitespace-nowrap' },
            { children: <DollarValue>{total}</DollarValue> },
            { children: '' },
            {
              children: (
                <SendSpotAssetButton
                  coin="USDC"
                  address="0x6d1e7cde53ba9467b783cb7c530ce054"
                  decimals={8}
                  total={total}
                  hold={hold}
                />
              )
            },
            {
              children: (
                <TransferUsdcButton
                  toPerp
                  minValue="0.000001"
                  maxValue={new BigNumber(total).minus(hold).decimalPlaces(6, BigNumber.ROUND_FLOOR).toFixed()}
                />
              ),
              className: 'whitespace-nowrap'
            },
            { children: '' }
          ]
        });
      }

      const { marginSummary, withdrawable } = perpsState;
      const { accountValue } = marginSummary;
      result.push({
        key: 'USDC (Perps)',
        cells: [
          { children: 'USDC (Perps)', className: 'whitespace-nowrap' },
          { children: `${accountValue} USDC`, className: 'whitespace-nowrap' },
          { children: `${withdrawable} USDC`, className: 'whitespace-nowrap' },
          { children: <DollarValue>{accountValue}</DollarValue> },
          { children: '' },
          { children: <SendPerpUsdcButton maxValue={withdrawable} /> },
          {
            children: <TransferUsdcButton toPerp={false} minValue="0.000001" maxValue={withdrawable} />,
            className: 'whitespace-nowrap'
          },
          { children: '' }
        ]
      });

      result = result.concat(
        nonUsdcSpotBalances.map(balance => {
          const { coin, token, total, hold, entryNtl } = balance;
          const { baseToken, internalName: pairName, quoteToken } = spotUsdcPairsByCoinIndex[token];
          const contractAddress = baseToken.tokenId;
          const fullUsdcValue = new BigNumber(total).times(lastPrices[pairName]);
          const pnl = new BigNumber(fullUsdcValue).minus(entryNtl).decimalPlaces(2);
          const pnlRate = pnl.div(entryNtl);

          return {
            key: coin,
            cells: [
              { children: coin },
              { children: `${total} ${coin}`, className: 'whitespace-nowrap' },
              { children: `${new BigNumber(total).minus(hold).toFixed()} ${coin}`, className: 'whitespace-nowrap' },
              { children: <DollarValue>{fullUsdcValue}</DollarValue> },
              { children: pnlRate.isFinite() ? <PnlView value={pnl} pnlRate={pnlRate} decimalPlaces={1} /> : null },
              {
                children: contractAddress ? (
                  <SendSpotAssetButton
                    coin={coin}
                    address={contractAddress}
                    decimals={quoteToken.weiDecimals}
                    total={total}
                    hold={hold}
                  />
                ) : null
              },
              { children: null },
              { children: contractAddress ? <HashChip hash={contractAddress} /> : null }
            ]
          };
        })
      );

      return result;
    }, [spotState.balances, perpsState, spotUsdcPairsByCoinIndex, lastPrices]);

    return <ScrollableTable className="h-32 text-font-description" columns={balancesColumns} rows={rows} />;
  }
);

const SendSpotAssetButton = memo<{ coin: string; address: HexString; decimals: number; total: string; hold: string }>(
  ({ coin, address, decimals, total, hold }) => {
    const minValue = useMemo(() => atomsToTokens(1, decimals).toFixed(), [decimals]);
    const maxValue = useMemo(() => new BigNumber(total).minus(hold).toFixed(), [total, hold]);

    const send = useCallback(
      async (destination: HexString, amount: string, exchangeClient: ExchangeClient) =>
        exchangeClient.spotSend({ token: `${coin}:${address}`, destination, amount }).then(noop),
      [address, coin]
    );

    return <SendAssetButton minValue={minValue} maxValue={maxValue} coin={coin} decimals={decimals} send={send} />;
  }
);

const SendPerpUsdcButton = memo<{ maxValue: string }>(({ maxValue }) => {
  const send = useCallback(
    async (destination: HexString, amount: string, exchangeClient: ExchangeClient) =>
      exchangeClient.usdSend({ destination, amount }).then(noop),
    []
  );

  return <SendAssetButton minValue="1.000001" maxValue={maxValue} coin="USDC" decimals={8} send={send} />;
});
