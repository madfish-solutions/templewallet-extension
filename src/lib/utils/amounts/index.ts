import BigNumber from 'bignumber.js';

export const formatAmountToTargetSize = (value: string | number, targetSize = 6) => {
  if (!Number.isFinite(Number(value))) return value;

  if (!Number.isInteger(targetSize) || targetSize < 1) {
    console.warn('Invalid `formatAmountToTargetSize` passed to `formatAmountToTargetSize`');
    return value;
  }

  const bn = new BigNumber(value);

  if (bn.isGreaterThanOrEqualTo(10 ** (targetSize - 1)))
    return bn.decimalPlaces(0, BigNumber.ROUND_HALF_EVEN).toString();

  return bn.toPrecision(targetSize, BigNumber.ROUND_HALF_EVEN).toString();
};
