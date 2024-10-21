import BigNumber from 'bignumber.js';

export const getAtomicValuePercentage = (
  value: BigNumber,
  percentage: BigNumber.Value,
  roundingMode: BigNumber.RoundingMode = BigNumber.ROUND_FLOOR
) => value.multipliedBy(percentage).div(100).integerValue(roundingMode);
