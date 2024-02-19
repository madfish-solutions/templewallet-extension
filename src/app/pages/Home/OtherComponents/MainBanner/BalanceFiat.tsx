import React, { memo, useMemo } from 'react';

import BigNumber from 'bignumber.js';

import Money from 'app/atoms/Money';
import { useFiatToUsdRate } from 'lib/fiat-currency';
import { isTruthy } from 'lib/utils';
import { ZERO } from 'lib/utils/numbers';

interface Props {
  totalBalanceInDollar: string;
  currency: string;
}
export const BalanceFiat = memo<Props>(({ totalBalanceInDollar, currency }) => {
  const fiatToUsdRate = useFiatToUsdRate();

  const volume = useMemo(
    () => (isTruthy(fiatToUsdRate) ? new BigNumber(totalBalanceInDollar).times(fiatToUsdRate) : ZERO),
    [totalBalanceInDollar, fiatToUsdRate]
  );

  return (
    <>
      <span className="mr-1">≈</span>
      <Money smallFractionFont={false} fiat>
        {volume}
      </Money>
      <span className="ml-1">{currency}</span>
    </>
  );
});
