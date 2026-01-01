import { useMemo } from 'react';

import { getEthAccountTransactions } from '@temple-wallet/everstake-wallet-sdk';
import BigNumber from 'bignumber.js';
import { formatEther } from 'viem';

import { useTokenHistoricalPrices } from 'app/templates/EarnDepositStats/hooks/use-token-historical-prices';
import { useFiatCurrency } from 'lib/fiat-currency/core';
import { useTypedSWR } from 'lib/swr';

import { ONE_MONTH_IN_MS } from '../constants';
import { toMsTimestamp } from '../utils';

export const useEthDepositChangeChart = (accountAddress?: string | null) => {
  const { selectedFiatCurrency } = useFiatCurrency();

  const {
    data: marketChartData,
    isLoading: isMarketChartLoading,
    error: marketChartError
  } = useTokenHistoricalPrices({
    id: 'ethereum',
    vs_currency: selectedFiatCurrency.apiLabel,
    days: 30
  });

  const {
    data: stakingTransactions,
    isLoading: isStakingTxLoading,
    error: stakingTxError
  } = useTypedSWR(
    ['eth-staking-transactions', accountAddress],
    () => {
      if (!accountAddress) return;

      return getEthAccountTransactions({ account: accountAddress, limit: 500 });
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000
    }
  );

  const isLoading = isMarketChartLoading || (Boolean(accountAddress) && isStakingTxLoading);
  const isError = Boolean(marketChartError || (Boolean(accountAddress) && stakingTxError));

  const data = useMemo(() => {
    if (!marketChartData?.prices?.length) {
      return;
    }

    const nowMs = Date.now();
    const monthAgoMs = nowMs - ONE_MONTH_IN_MS;

    const pricePoints = marketChartData.prices
      .map(([timestamp, fiatPrice]) => ({ timestamp, fiatPrice }))
      .filter(point => point.timestamp >= monthAgoMs && point.timestamp <= nowMs);

    if (!pricePoints.length) {
      return;
    }

    if (!stakingTransactions || !stakingTransactions.length || !accountAddress) {
      return pricePoints.map(({ timestamp }) => [timestamp, 0]);
    }

    const txs = stakingTransactions
      .map(tx => ({
        type: tx.type,
        timestamp: toMsTimestamp(tx.created_at),
        amount: formatEther(BigInt(tx.amount))
      }))
      .sort((a, b) => a.timestamp - b.timestamp);

    let staked = new BigNumber(0);
    let txIndex = 0;

    const series: [number, number][] = [];

    for (const { timestamp, fiatPrice } of pricePoints) {
      while (txIndex < txs.length && txs[txIndex].timestamp <= timestamp) {
        const tx = txs[txIndex];

        switch (tx.type) {
          case 'stake':
            staked = staked.plus(tx.amount);
            break;
          case 'unstake':
            staked = BigNumber.max(0, staked.minus(tx.amount));
            break;
          default:
            break;
        }

        txIndex++;
      }

      const depositInFiat = staked.multipliedBy(fiatPrice).toNumber();

      series.push([timestamp, depositInFiat]);
    }

    if (!series.length) {
      return;
    }

    return series;
  }, [marketChartData, stakingTransactions, accountAddress]);

  return {
    data,
    isLoading,
    isError
  };
};
