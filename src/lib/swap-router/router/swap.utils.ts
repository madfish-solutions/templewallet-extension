import { BigNumber } from 'bignumber.js';

import { FeeInterface } from '../fee.interface';

export const findSwapOutput = (
  inputAmount: BigNumber,
  inputPool: BigNumber,
  outputPool: BigNumber,
  fee: FeeInterface
) => {
  const inputAmountWithFee = inputAmount.times(fee.numerator);

  const numerator = inputAmountWithFee.times(outputPool);
  const denominator = inputPool.times(fee.denominator).plus(inputAmountWithFee);

  return numerator.idiv(denominator);
};
