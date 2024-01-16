import React, { FC } from 'react';

import { BigNumber } from 'bignumber.js';
import classNames from 'clsx';

import { kFormatter } from 'lib/utils/numbers';

interface Props {
  amount: string;
  baseAmount: string | undefined;
  className?: string;
}

const BASE = new BigNumber(100);
const PERCENTAGE_DECIMALS = 1;
const AMOUNT_DECIMALS = 2;

const calculatePercentage = (base: string | undefined, part: string) => {
  if (base === undefined) {
    return;
  }

  const amountToFormat = BASE.multipliedBy(part).dividedBy(base);

  if (amountToFormat.isGreaterThanOrEqualTo(BASE)) {
    return BASE.toFixed();
  }

  return amountToFormat.toFixed(PERCENTAGE_DECIMALS);
};

export const SwapRouteAmounts: FC<Props> = ({ amount, baseAmount, className }) => {
  return (
    <div className={classNames('w-10', className)}>
      <div className="text-gray-600">{kFormatter(Number(new BigNumber(amount).toFixed(AMOUNT_DECIMALS)))}</div>
      <div className="text-blue-500">{calculatePercentage(baseAmount, amount)}%</div>
    </div>
  );
};
