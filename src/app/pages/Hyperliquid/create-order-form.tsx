import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { ExchangeClient } from '@nktkas/hyperliquid';
import BigNumber from 'bignumber.js';

import AssetField from 'app/atoms/AssetField';
import { SettingsCheckbox } from 'app/atoms/SettingsCheckbox';
import { StyledButton } from 'app/atoms/StyledButton';
import { toastError, toastSuccess } from 'app/toaster';
import { toPercentage } from 'lib/ui/utils';
import { useAccountForEvm } from 'temple/front';

import { useAccountStates } from './account-states-provider';
import { useClients } from './clients';
import { useFeesStats } from './fees-stats-provider';
import { AccountStates, TradePair } from './types';
import { BUILDER_ADDRESS, BUILDER_FEE_UNITS, formatPrice } from './utils';

export const CreateOrderForm = memo<{ pair: TradePair }>(({ pair }) => {
  const { accountStates } = useAccountStates();
  const evmAccount = useAccountForEvm();
  const {
    clients: { exchange }
  } = useClients();

  if (!evmAccount || !exchange || !accountStates) {
    return null;
  }

  return <CreateOrderFormContent pair={pair} exchangeClient={exchange} accountStates={accountStates} />;
});

interface CreateOrderFormContentProps {
  pair: TradePair;
  exchangeClient: ExchangeClient;
  accountStates: AccountStates;
}

const builderFeeFraction = BUILDER_FEE_UNITS / 1e5;

const CreateOrderFormContent = memo<CreateOrderFormContentProps>(({ pair, exchangeClient, accountStates }) => {
  const { assetPositions: perpPositions } = accountStates.perpsState;
  const [inputValue, setInputValue] = useState<string | undefined>('');
  const [reduceOnly, setReduceOnly] = useState(false);
  const [inProgress, setInProgress] = useState(false);

  const alreadyPresentPosition = useMemo(
    () =>
      pair.type === 'perp'
        ? perpPositions.find(x => x.position.coin === pair.internalName && x.position.leverage.type === 'cross')
        : undefined,
    [pair.internalName, pair.type, perpPositions]
  );

  useEffect(() => {
    if (!alreadyPresentPosition || pair.type === 'spot') {
      setReduceOnly(false);
    }
  }, [alreadyPresentPosition, pair.type]);

  const cleanInputValue = useCallback(() => setInputValue(undefined), [setInputValue]);
  const parsedInputValue = useMemo(() => new BigNumber(inputValue ?? ''), [inputValue]);
  const tokenName = pair.type === 'spot' ? pair.baseToken.displayName : pair.internalName;
  const orderCreationIsDisabled = inProgress || !parsedInputValue.isPositive();
  const buyPrice = useMemo(() => formatPrice(new BigNumber(pair.markPx).times(1.01)), [pair.markPx]);
  const sellPrice = useMemo(() => formatPrice(new BigNumber(pair.markPx).times(0.99)), [pair.markPx]);
  const quoteOrderSizeDecimals = pair.type === 'spot' ? pair.quoteToken.szDecimals : 6;
  const buyOrderSize = useMemo(
    () =>
      parsedInputValue.isPositive()
        ? new BigNumber(buyPrice).times(parsedInputValue).decimalPlaces(quoteOrderSizeDecimals).toFixed()
        : '',
    [buyPrice, quoteOrderSizeDecimals, parsedInputValue]
  );
  const sellOrderSize = useMemo(
    () =>
      parsedInputValue.isPositive()
        ? new BigNumber(sellPrice).times(parsedInputValue).decimalPlaces(quoteOrderSizeDecimals).toFixed()
        : '',
    [sellPrice, quoteOrderSizeDecimals, parsedInputValue]
  );

  const { fees, approvalIsSufficient, updateFees } = useFeesStats();

  const createOrder = useCallback(
    async (isBuy: boolean) => {
      try {
        setInProgress(true);
        const result = await exchangeClient.order({
          orders: [
            {
              a: pair.id,
              b: isBuy,
              p: isBuy ? buyPrice : sellPrice,
              s: parsedInputValue.toFixed(),
              t: { limit: { tif: 'FrontendMarket' } },
              r: reduceOnly
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
          `Placed order ${'resting' in status ? status.resting.oid : status.filled.oid} for ${
            pair.type === 'spot' ? (isBuy ? 'buying' : 'selling') : `${isBuy ? 'long' : 'short'}ing`
          } ${parsedInputValue.toFixed()} ${tokenName}`
        );
      } catch (e) {
        console.error(e);
        toastError(
          `Failed to ${
            pair.type === 'spot' ? (isBuy ? 'buy' : 'sell') : `${isBuy ? 'long' : 'short'} for`
          } ${parsedInputValue.toFixed()} ${tokenName}`
        );
      } finally {
        setInProgress(false);
      }
    },
    [buyPrice, exchangeClient, pair.id, pair.type, parsedInputValue, reduceOnly, sellPrice, tokenName]
  );
  const handleApproveClick = useCallback(async () => {
    try {
      setInProgress(true);
      await exchangeClient.approveBuilderFee({ builder: BUILDER_ADDRESS, maxFeeRate: `${BUILDER_FEE_UNITS / 1e3}%` });
      await updateFees();
      toastSuccess('Builder fee approval successful');
    } catch (e) {
      console.error(e);
      toastError('Failed to approve builder fee');
    } finally {
      setInProgress(false);
    }
  }, [exchangeClient, updateFees]);
  const handleBuyClick = useCallback(() => createOrder(true), [createOrder]);
  const handleSellClick = useCallback(() => createOrder(false), [createOrder]);

  return (
    <div className="flex flex-col gap-1">
      <AssetField
        value={inputValue}
        onChange={setInputValue}
        extraFloatingInner={tokenName}
        assetDecimals={pair.type === 'spot' ? pair.baseToken.szDecimals : pair.szDecimals}
        cleanable={Boolean(inputValue)}
        onClean={cleanInputValue}
        label={`Order size ${pair.type === 'spot' ? '' : `(max leverage ${pair.maxLeverage}x)`}`}
      />
      {pair.type === 'perp' && alreadyPresentPosition && (
        <SettingsCheckbox
          checked={reduceOnly}
          onChange={setReduceOnly}
          label="Reduce only"
          tooltip="This order will not open a new position no matter how large the order is"
        />
      )}

      <table>
        <thead>
          <tr>
            <th />
            <th className="text-left">Buy</th>
            <th className="text-left">Sell</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Price</td>
            <td>{buyPrice}</td>
            <td>{sellPrice}</td>
          </tr>
          {parsedInputValue.isPositive() && (
            <tr>
              <td>Total ({pair.type === 'spot' ? pair.quoteToken.name : 'USDC'})</td>
              <td>{buyOrderSize}</td>
              <td>{sellOrderSize}</td>
            </tr>
          )}
          {fees && (
            <tr>
              <td>Fee</td>
              <td>
                {toPercentage(
                  builderFeeFraction + Number(pair.type === 'spot' ? fees.userSpotCrossRate : fees.userCrossRate),
                  undefined,
                  4
                )}
              </td>
              <td>
                {toPercentage(
                  builderFeeFraction + Number(pair.type === 'spot' ? fees.userSpotAddRate : fees.userAddRate),
                  undefined,
                  4
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex gap-4">
        {approvalIsSufficient ? (
          <>
            <StyledButton
              className="flex-1"
              size="L"
              color="secondary"
              onClick={handleBuyClick}
              disabled={orderCreationIsDisabled}
            >
              {pair.type === 'spot' ? 'Buy' : 'Buy (Long)'}
            </StyledButton>
            <StyledButton
              className="flex-1"
              size="L"
              color="red"
              onClick={handleSellClick}
              disabled={orderCreationIsDisabled}
            >
              {pair.type === 'spot' ? 'Sell' : 'Sell (Short)'}
            </StyledButton>
          </>
        ) : (
          <StyledButton
            className="flex-1"
            disabled={inProgress}
            size="L"
            color="secondary"
            onClick={handleApproveClick}
          >
            Approve builder fee
          </StyledButton>
        )}
      </div>
    </div>
  );
});
