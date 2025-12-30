import { useMemo } from 'react';

import { type TzktStakingUpdate } from 'lib/apis/tzkt';
import { useFiatCurrency } from 'lib/fiat-currency/core';
import { mutezToTz } from 'lib/temple/helpers';
import { TempleTezosChainId } from 'lib/temple/types';

import { ONE_MONTH_IN_MS } from '../constants';
import { toMsTimestamp } from '../utils';

import { useDelegatedFrom3MonthsTimestamp } from './use-delegated-from-3-months-timestamp';
import { useTezosAccountBalanceHistory } from './use-tezos-account-balance-history';
import { useTezosAccountStakingUpdates } from './use-tezos-account-staking-updates';
import { useTokenHistoricalPrices } from './use-token-historical-prices';

export const useTezosDepositChangeChart = (accountPkh: string) => {
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

  const {
    data: delegatedFromMs,
    isLoading: isDelegationLoading,
    error: delegationError
  } = useDelegatedFrom3MonthsTimestamp(accountPkh, TempleTezosChainId.Mainnet);

  const isLoading = isBalanceHistoryLoading || isStakingUpdatesLoading || isMarketChartLoading || isDelegationLoading;
  const isError = Boolean(balanceHistoryError || stakingUpdatesError || marketChartError || delegationError);

  const data = useMemo(() => {
    if (!balanceHistory?.length || !stakingUpdates || !marketChartData?.prices?.length) {
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

    const balancePoints = balanceHistory
      .map(item => ({
        timestamp: toMsTimestamp(item.timestamp),
        value: item.balance
      }))
      .filter(point => point.timestamp >= monthAgoMs && point.timestamp <= nowMs)
      .toReversed();

    if (!balancePoints.length) {
      return;
    }

    const stakedTimeline = buildStakedBalanceTimeline(stakingUpdates, monthAgoMs);
    const stakedPoints = stakedTimeline.map(point => ({
      timestamp: point.timestamp,
      value: point.stakedMutez
    }));

    const getBalanceAt = createStepFunctionGetter(balancePoints);
    const getStakedAt = createStepFunctionGetter(stakedPoints);
    const delegatedFrom = delegatedFromMs ?? null;

    return pricePoints.map(({ timestamp, fiatPrice }) => {
      if (delegatedFrom === null || timestamp < delegatedFrom) {
        return [timestamp, 0];
      }

      const liquidMutez = getBalanceAt(timestamp);
      const stakedMutez = getStakedAt(timestamp);

      const totalTez = mutezToTz(liquidMutez + stakedMutez);
      const depositInFiat = totalTez.multipliedBy(fiatPrice).toNumber();

      return [timestamp, depositInFiat];
    });
  }, [balanceHistory, stakingUpdates, marketChartData, delegatedFromMs]);

  return {
    data,
    selectedFiatCurrency,
    isLoading,
    isError
  };
};

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
        stakedMutez = Math.max(0, stakedMutez - update.amount);
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
