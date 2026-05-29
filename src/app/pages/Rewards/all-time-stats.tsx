import { FC } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';

import { t } from 'lib/i18n';
import { ZERO } from 'lib/utils/numbers';

import { BalanceAmount } from './balance-amount';

interface AllTimeStatsProps {
  total: BigNumber | null | undefined;
  lastAmount: string | null | undefined;
  unit: string;
}

export const AllTimeStats: FC<AllTimeStatsProps> = ({ total, lastAmount, unit }) => {
  const lastAmountBn = new BigNumber(lastAmount ?? 0);
  const isPositive = lastAmountBn.isGreaterThan(0);
  return (
    <div className="w-full flex flex-col">
      <span className="text-font-description text-grey-1 mb-0.5">{t('allTime')}</span>
      <span className="text-font-num-bold-16 text-text inline-flex items-baseline gap-1">
        <BalanceAmount value={total ?? ZERO} />
        <span>{unit}</span>
      </span>
      <span className={clsx('text-font-num-12', isPositive ? 'text-success' : 'text-grey-1')}>
        {isPositive && '+'}
        <BalanceAmount value={lastAmountBn} />
      </span>
    </div>
  );
};
