import { useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { checkDeposit } from '../utils';

export const useDepositChartDerivedValues = (chartData?: number[][]) => {
  const changePercent = useMemo(() => {
    if (!chartData || !chartData.length) {
      return;
    }

    const [firstTimestamp, firstValue] = chartData[0];
    const [lastTimestamp, lastValue] = chartData[chartData.length - 1];

    if (firstTimestamp === lastTimestamp || firstValue <= 0) {
      return;
    }

    return ((lastValue - firstValue) / firstValue) * 100;
  }, [chartData]);

  const fiatChangeValues = useMemo(
    () =>
      chartData?.map(([timestamp, price]) => ({
        timestamp,
        value: price
      })) ?? [],
    [chartData]
  );

  const latestFiatValue = useMemo(
    () => (chartData?.length ? chartData[chartData.length - 1][1] : undefined),
    [chartData]
  );

  const changePercentBn = useMemo(
    () => (typeof changePercent === 'number' ? new BigNumber(changePercent).decimalPlaces(2) : undefined),
    [changePercent]
  );

  const hasDeposits = useMemo(() => checkDeposit(chartData), [chartData]);

  const isChangePositive = Boolean(changePercentBn && changePercentBn.gt(0));
  const isChangeNegative = Boolean(changePercentBn && changePercentBn.lt(0));

  return {
    fiatChangeValues,
    latestFiatValue,
    changePercentBn,
    isChangePositive,
    isChangeNegative,
    hasDeposits
  };
};
