import BigNumber from 'bignumber.js';

import { toSubscriptNotation } from './numbers';

jest.mock('./core', () => ({}));
jest.mock('./react', () => ({}));

describe('toSubscriptNotation', () => {
  it.each([
    ['0.0000002609', '.', '0.0₆2609'],
    ['0.000009152', '.', '0.0₅9152'],
    ['0.000000028113258341', '.', '0.0₇28113258341'],
    ['0.000000201376815293', '.', '0.0₆201376815293'],
    ['0.000000100000000000000001', '.', '0.0₆100000000000000001'],
    ['0.0000001', '.', '0.0₆1'],
    ['-0.0000002609', '.', '-0.0₆2609'],
    ['0.0000002609', ',', '0,0₆2609'],
    ['-0.0000002609', ',', '-0,0₆2609'],
    ['1.234e-11', '.', '0.0₁₀1234'],
    ['1e-19', '.', '0.0₁₈1']
  ])('formats %s with decimal separator %s as %s', (value, decimalSeparator, expected) => {
    expect(toSubscriptNotation(new BigNumber(value), decimalSeparator)).toBe(expected);
  });

  it.each([
    ['0.000000028113258341', 6, '0.0₇281132'],
    ['0.000000028113258341', 2, '0.0₇28'],
    ['0.000000201376815293', 6, '0.0₆201376'],
    ['-0.000000028113258341', 6, '-0.0₇281132'],
    ['0.0000001', 6, '0.0₆1'],
    ['0.000000028113258341', 0, '0.0₇2']
  ] as const)('limits %s to %s significant digits as %s', (value, decimals, expected) => {
    expect(toSubscriptNotation(new BigNumber(value), '.', decimals)).toBe(expected);
  });

  it.each([
    ['0.000000028113258341', 6, BigNumber.ROUND_HALF_UP, '0.0₇281133'],
    ['-0.000000028113258341', 6, BigNumber.ROUND_FLOOR, '-0.0₇281133'],
    ['-0.000000028113258341', 6, BigNumber.ROUND_CEIL, '-0.0₇281132'],
    ['0.00000009999', 2, BigNumber.ROUND_HALF_UP, '0.0₆1']
  ] as const)('formats %s with precision %s and mode %s as %s', (value, decimals, roundingMode, expected) => {
    expect(toSubscriptNotation(new BigNumber(value), '.', decimals, roundingMode)).toBe(expected);
  });

  it('uses the decimal separator with a digit limit', () => {
    expect(toSubscriptNotation(new BigNumber('0.000000028113258341'), ',', 6)).toBe('0,0₇281132');
  });

  it.each(['0', '-0', '1', '-1', '0.1', '0.01'])('keeps %s in decimal notation', value => {
    expect(toSubscriptNotation(new BigNumber(value), '.')).toBe(new BigNumber(value).toFixed());
  });
});
