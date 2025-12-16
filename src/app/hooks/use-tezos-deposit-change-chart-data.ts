import { useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useTezosAccountBalanceHistory } from 'app/hooks/use-tezos-account-balance-history';
import { useTezosAccountStakingUpdates } from 'app/hooks/use-tezos-account-staking-updates';
import { useTokenHistoricalPrices } from 'app/hooks/use-token-historical-prices';
import type { TzktStakingUpdate } from 'lib/apis/tzkt';
import { useFiatCurrency } from 'lib/fiat-currency/core';
import { TempleTezosChainId } from 'lib/temple/types';
import { useAccountAddressForTezos } from 'temple/front';

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
const ONE_MONTH_IN_MS = 30 * ONE_DAY_IN_MS;
const MUTEZ_IN_TEZ = 1_000_000;

type DepositChartPoint = [timestamp: number, value: number];

export interface UseTezosDepositChangeChartDataResult {
  data?: DepositChartPoint[];
  changePercent?: number;
  isLoading: boolean;
  isError: boolean;
}

const buildStakedBalanceTimeline = (updates: TzktStakingUpdate[], fromTimestampMs: number) => {
  if (!updates.length) {
    return [{ timestamp: fromTimestampMs, stakedMutez: 0 }];
  }

  const sortedUpdates = [...updates].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  let stakedMutez = 0;
  let stakedAtFromTimestamp = 0;

  const timeline: Array<{ timestamp: number; stakedMutez: number }> = [];

  for (const update of sortedUpdates) {
    const ts = new Date(update.timestamp).getTime();

    switch (update.type) {
      case 'stake':
      case 'reward':
        stakedMutez += update.amount;
        break;
      case 'unstake':
      case 'slash':
        stakedMutez -= update.amount;
        break;
      default:
        break;
    }

    if (ts <= fromTimestampMs) {
      stakedAtFromTimestamp = stakedMutez;
    } else {
      timeline.push({ timestamp: ts, stakedMutez });
    }
  }

  timeline.unshift({ timestamp: fromTimestampMs, stakedMutez: stakedAtFromTimestamp });

  return timeline;
};

const createStepFunctionGetter = (points: Array<{ timestamp: number; value: number }>) => {
  if (!points.length) {
    return () => 0;
  }

  const sorted = [...points].sort((a, b) => a.timestamp - b.timestamp);

  return (timestamp: number) => {
    let currentValue = sorted[0].value;

    for (let i = 1; i < sorted.length; i++) {
      const point = sorted[i];

      if (point.timestamp > timestamp) {
        break;
      }

      currentValue = point.value;
    }

    return currentValue;
  };
};

export const useTezosDepositChangeChartData = (): UseTezosDepositChangeChartDataResult => {
  const accountPkh = useAccountAddressForTezos();
  const { selectedFiatCurrency } = useFiatCurrency();

  const nowMs = Date.now();
  const monthAgoMs = nowMs - ONE_MONTH_IN_MS;

  const {
    data: balanceHistory,
    isLoading: isBalanceHistoryLoading,
    error: balanceHistoryError
  } = useTezosAccountBalanceHistory(accountPkh!, TempleTezosChainId.Mainnet, {
    limit: 500,
    step: 3_600 // approximate hourly balance history
  });

  const {
    data: stakingUpdates,
    isLoading: isStakingUpdatesLoading,
    error: stakingUpdatesError
  } = useTezosAccountStakingUpdates(accountPkh!, TempleTezosChainId.Mainnet);

  const {
    data: marketChartData,
    isLoading: isMarketChartLoading,
    error: marketChartError
  } = useTokenHistoricalPrices({
    id: 'tezos',
    vs_currency: selectedFiatCurrency.apiLabel,
    days: 30
  });

  const isLoading = isBalanceHistoryLoading || isStakingUpdatesLoading || isMarketChartLoading;
  const isError = isDefined(balanceHistoryError) || isDefined(stakingUpdatesError) || isDefined(marketChartError);

  const { data, changePercent } = useMemo(() => {
    if (!accountPkh || !balanceHistory || !stakingUpdates || !marketChartData?.prices?.length) {
      return { data: undefined, changePercent: undefined };
    }

    const pricePoints = marketChartData.prices
      .map(([timestamp, fiatPrice]) => ({ timestamp, fiatPrice }))
      .filter(point => point.timestamp >= monthAgoMs && point.timestamp <= nowMs)
      .sort((a, b) => a.timestamp - b.timestamp);

    if (!pricePoints.length) {
      return { data: undefined, changePercent: undefined };
    }

    const balancePoints = balanceHistory
      .map(item => ({
        timestamp: new Date(item.timestamp).getTime(),
        value: item.balance
      }))
      .filter(point => point.timestamp <= nowMs)
      .sort((a, b) => a.timestamp - b.timestamp);

    if (!balancePoints.length) {
      return { data: undefined, changePercent: undefined };
    }

    const stakedTimeline = buildStakedBalanceTimeline(stakingUpdates, monthAgoMs);
    const stakedPoints = stakedTimeline.map(point => ({
      timestamp: point.timestamp,
      value: point.stakedMutez
    }));

    const getBalanceAt = createStepFunctionGetter(balancePoints);
    const getStakedAt = createStepFunctionGetter(stakedPoints);

    const series: DepositChartPoint[] = pricePoints.map(({ timestamp, fiatPrice }) => {
      const liquidMutez = getBalanceAt(timestamp);
      const stakedMutez = getStakedAt(timestamp);

      const totalTez = (liquidMutez + stakedMutez) / MUTEZ_IN_TEZ;
      const depositInFiat = totalTez * fiatPrice;

      return [timestamp, depositInFiat];
    });

    if (!series.length) {
      return { data: undefined, changePercent: undefined };
    }

    const [firstTimestamp, firstValue] = series[0];
    const [lastTimestamp, lastValue] = series[series.length - 1];

    if (firstTimestamp === lastTimestamp || firstValue <= 0) {
      return { data: series, changePercent: undefined };
    }

    const changePercent = ((lastValue - firstValue) / firstValue) * 100;

    return { data: series, changePercent };
  }, [accountPkh, balanceHistory, stakingUpdates, marketChartData, monthAgoMs, nowMs]);

  return {
    data,
    changePercent,
    isLoading,
    isError
  };
};
