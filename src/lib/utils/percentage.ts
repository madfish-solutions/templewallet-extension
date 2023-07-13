import BigNumber from 'bignumber.js';

export const percentageToFraction = (value: BigNumber.Value) => new BigNumber(value).div(100);
