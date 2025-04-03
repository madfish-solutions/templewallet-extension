import BigNumber from 'bignumber.js';

import { TempleAccountType } from 'lib/temple/types';

export const getTezosMaxAmountToken = (
  accountType: TempleAccountType,
  balance: BigNumber,
  baseFee: BigNumber,
  safeFeeValue: number,
  remainder: BigNumber.Value
) =>
  BigNumber.max(
    accountType === TempleAccountType.ManagedKT
      ? balance
      : balance
          .minus(baseFee)
          .minus(safeFeeValue ?? 0)
          .minus(remainder),
    0
  );
