import { useMemo } from 'react';

import { RpStatsResponse, toMonthYearIndex } from 'lib/apis/ads-api';

import { useSelector } from '../index';

export const useRpForTodaySelector = (accountPkh: string): RpStatsResponse | undefined =>
  useSelector(({ rewards }) => rewards.rpForToday[accountPkh]?.data);

export const useRpForTodayErrorSelector = (accountPkh: string) =>
  useSelector(({ rewards }) => rewards.rpForToday[accountPkh]?.error);

const useRpForMonthsSelector = (accountPkh: string) =>
  useSelector(({ rewards }) => rewards.rpForMonths[accountPkh]?.data ?? {});

export const useRpForMonthSelector = (accountPkh: string, monthYearIndex: number): RpStatsResponse | undefined =>
  useSelector(({ rewards }) => rewards.rpForMonths[accountPkh]?.data?.[monthYearIndex]);

export const useRpForMonthsLoadingSelector = (accountPkh: string) =>
  useSelector(({ rewards }) => rewards.rpForMonths[accountPkh]?.isLoading ?? true);

export const useRpForMonthsErrorSelector = (accountPkh: string) =>
  useSelector(({ rewards }) => rewards.rpForMonths[accountPkh]?.error);

export const useEarliestLoadedMonthYearIndex = (accountPkh: string) => {
  const rpForMonths = useRpForMonthsSelector(accountPkh);

  return useMemo(() => {
    const rawValue = Object.keys(rpForMonths).sort().shift();

    return rawValue ? parseInt(rawValue) : undefined;
  }, [rpForMonths]);
};

export const useLifetimeEarnings = (accountPkh: string, now: Date) => {
  const rpForMonths = useRpForMonthsSelector(accountPkh);

  return useMemo(() => {
    return Object.entries(rpForMonths)
      .map(([rawMonthYearIndex, value]): [number, RpStatsResponse] => [parseInt(rawMonthYearIndex), value])
      .filter(([monthYearIndex]) => monthYearIndex !== toMonthYearIndex(now))
      .sort(([a], [b]) => b - a);
  }, [now, rpForMonths]);
};

export const useFirstActivityDateSelector = (accountPkh: string) =>
  useSelector(({ rewards }) => rewards.firstActivityDates[accountPkh] ?? null);
