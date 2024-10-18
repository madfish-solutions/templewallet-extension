import BigNumber from 'bignumber.js';

export const getAtomicValuePercentage = (value: BigNumber, percentage: BigNumber.Value) =>
  value.multipliedBy(percentage).dividedToIntegerBy(100);
