import { useMemo } from 'react';

import { useTezosAccountBalanceHistory } from 'app/hooks/use-tezos-account-balance-history';
import { useTezosAccountStakingUpdates } from 'app/hooks/use-tezos-account-staking-updates';
import { useTokenHistoricalPrices } from 'app/hooks/use-token-historical-prices';
import type { TzktStakingUpdate } from 'lib/apis/tzkt';
import { useFiatCurrency } from 'lib/fiat-currency/core';
import { mutezToTz } from 'lib/temple/helpers';
import { TempleTezosChainId } from 'lib/temple/types';

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
const ONE_MONTH_IN_MS = 30 * ONE_DAY_IN_MS;

export const useTezosDepositChangeChartData = (accountPkh: string) => {
  const { selectedFiatCurrency } = useFiatCurrency();

  const {
    data: balanceHistory,
    isLoading: isBalanceHistoryLoading,
    error: balanceHistoryError
  } = useTezosAccountBalanceHistory(accountPkh, TempleTezosChainId.Mainnet, {
    limit: 720,
    step: 450
  });

  const {
    data: stakingUpdates,
    isLoading: isStakingUpdatesLoading,
    error: stakingUpdatesError
  } = useTezosAccountStakingUpdates(accountPkh, TempleTezosChainId.Mainnet, { limit: 500 });

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
  const isError = Boolean(balanceHistoryError || stakingUpdatesError || marketChartError);

  const { data, changePercent } = useMemo(() => {
    if (!balanceHistory?.length || !stakingUpdates || !marketChartData?.prices?.length) {
      return { data: undefined, changePercent: undefined };
    }

    const nowMs = Date.now();
    const monthAgoMs = nowMs - ONE_MONTH_IN_MS;

    const pricePoints = marketChartData.prices
      .map(([timestamp, fiatPrice]) => ({ timestamp, fiatPrice }))
      .filter(point => point.timestamp >= monthAgoMs && point.timestamp <= nowMs);

    if (!pricePoints.length) {
      return { data: undefined, changePercent: undefined };
    }

    const balancePoints = balanceHistory
      .map(item => ({
        timestamp: new Date(item.timestamp).getTime(),
        value: item.balance
      }))
      .filter(point => point.timestamp >= monthAgoMs && point.timestamp <= nowMs)
      .toReversed();

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

    const series = pricePoints.map(({ timestamp, fiatPrice }) => {
      const liquidMutez = getBalanceAt(timestamp);
      const stakedMutez = getStakedAt(timestamp);

      const totalTez = mutezToTz(liquidMutez + stakedMutez);
      const depositInFiat = totalTez.multipliedBy(fiatPrice).toNumber();

      return [timestamp, depositInFiat];
    });

    const [firstTimestamp, firstValue] = series[0];
    const [lastTimestamp, lastValue] = series[series.length - 1];

    if (firstTimestamp === lastTimestamp || firstValue <= 0) {
      return { data: series, changePercent: undefined };
    }

    const changePercent = ((lastValue - firstValue) / firstValue) * 100;

    return { data: series, changePercent };
  }, [balanceHistory, stakingUpdates, marketChartData]);

  return {
    data,
    selectedFiatCurrency,
    changePercent,
    isLoading,
    isError
  };
};

const toMsTimestamp = (isoTimestamp: string) => new Date(isoTimestamp).getTime();

const buildStakedBalanceTimeline = (updates: TzktStakingUpdate[], fromTimestampMs: number) => {
  if (!updates.length) {
    return [{ timestamp: fromTimestampMs, stakedMutez: 0 }];
  }

  const sortedUpdates = updates.toReversed();

  let stakedMutez = 0;
  let stakedAtFromTimestamp = 0;

  const timeline: Array<{ timestamp: number; stakedMutez: number }> = [];

  for (const update of sortedUpdates) {
    const ts = toMsTimestamp(update.timestamp);

    switch (update.type) {
      case 'stake':
        stakedMutez += update.amount;
        break;
      case 'finalize':
        const newAmount = stakedMutez - update.amount;
        stakedMutez = newAmount >= 0 ? newAmount : 0;
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

  return (timestamp: number) => {
    let currentValue = points[0].value;

    for (let i = 1; i < points.length; i++) {
      const point = points[i];

      if (point.timestamp > timestamp) {
        break;
      }

      currentValue = point.value;
    }

    return currentValue;
  };
};
