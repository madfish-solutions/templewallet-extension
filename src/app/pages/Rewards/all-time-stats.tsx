import { FC } from 'react';

import BigNumber from 'bignumber.js';

import { t } from 'lib/i18n';

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
    <div className="w-full pt-1 flex flex-col">
      <span className="text-font-description text-grey-1">{t('allTime')}</span>
      <span className="text-font-num-bold-16 text-text inline-flex items-baseline gap-1">
        <BalanceAmount value={total ?? new BigNumber(0)} />
        <span>{unit}</span>
      </span>
      <span className={isPositive ? 'text-font-num-12 text-success' : 'text-font-num-12 text-grey-1'}>
        {isPositive && '+'}
        <BalanceAmount value={lastAmountBn} />
      </span>
    </div>
  );
};
