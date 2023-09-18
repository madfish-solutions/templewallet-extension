import BigNumber from 'bignumber.js';

export const ZERO = new BigNumber(0);

export const isPositiveNumber = (value?: number): value is number => value != null && value > 0;
