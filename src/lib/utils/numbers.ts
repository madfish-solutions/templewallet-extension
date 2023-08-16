import BigNumber from 'bignumber.js';

export const isPositiveNumber = (value?: number): value is number => value != null && value > 0;

export const ZERO = new BigNumber(0);
