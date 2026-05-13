import { FC, PropsWithChildren } from 'react';

import { BigNumber } from 'bignumber.js';

import { IconBase, Loader } from 'app/atoms';
import { ReactComponent as InfoIcon } from 'app/icons/base/InfoFill.svg';
import { t, toLocalFormat } from 'lib/i18n';
import useTippy from 'lib/ui/useTippy';
import { Link } from 'lib/woozie';

import { BalanceAmount } from '../balance-amount';
import { dealsInfoTippyProps } from '../tooltip';

const DealsCardShell: FC<PropsWithChildren> = ({ children }) => {
  const tooltipRef = useTippy<HTMLDivElement>(dealsInfoTippyProps);

  return (
    <div className="bg-white rounded-8 border-0.5 border-lines p-1 flex flex-col justify-center gap-1">
      <div className="flex items-center justify-between p-2 pr-1">
        <span className="text-font-medium-bold">{t('deals')}</span>
        <IconBase ref={tooltipRef} size={16} Icon={InfoIcon} className="text-grey-2" />
      </div>
      {children}
      <div className="flex py-1 self-center">
        <Link
          to="/rewards/deals/how-it-works"
          className="self-center py-0.5 px-1 text-font-description-bold text-secondary"
        >
          {t('howItWorksLink')}
        </Link>
      </div>
    </div>
  );
};

interface DealsBalancesProps {
  allTime: BigNumber | null;
  lastPayoutAmount: string | null;
  pending: BigNumber | null;
  pendingDelta: BigNumber | null;
}

export const DealsBalances: FC<DealsBalancesProps> = ({ allTime, lastPayoutAmount, pending, pendingDelta }) => (
  <DealsCardShell>
    <div className="bg-grey-4 rounded-6 p-2 flex gap-2 min-h-26.5">
      <BalanceCell
        label={t('dealsAllTime')}
        amount={allTime}
        subAmount={lastPayoutAmount ? new BigNumber(lastPayoutAmount) : new BigNumber(0)}
        highlighted
      />
      <BalanceCell
        label={t('dealsPending')}
        amount={pending}
        subAmount={pendingDelta ?? new BigNumber(0)}
        amountLessThanThreshold={0.01}
        subAlwaysGrey
        subTippyContent="This is last activity"
      />
    </div>
  </DealsCardShell>
);

export const DealsEmptyState: FC = () => (
  <DealsCardShell>
    <div className="bg-grey-4 py-4.5 rounded-sm flex flex-col justify-center items-center min-h-26.5">
      <span className="text-font-description text-grey-1 text-center">{t('templeDealsEmptyState')}</span>
      <span className="text-font-description text-grey-1 text-center">{t('templeDealsEmptyStateSubtitle')}</span>
    </div>
  </DealsCardShell>
);

export const DealsLoadingState: FC = () => (
  <DealsCardShell>
    <div className="bg-grey-4 rounded-6 p-2 flex gap-2 min-h-26.5">
      <LoadingCell label={t('dealsAllTime')} highlighted />
      <LoadingCell label={t('dealsPending')} />
    </div>
  </DealsCardShell>
);

interface LoadingCellProps {
  label: string;
  highlighted?: boolean;
}

const LoadingCell: FC<LoadingCellProps> = ({ label, highlighted }) => (
  <div className={`flex-1 rounded-8 px-2 py-3 flex flex-col gap-2 ${highlighted ? 'bg-white' : ''}`}>
    <span className="text-font-description-bold text-grey-1">{label}</span>
    <div className="flex-1 flex justify-center items-center">
      <Loader size="L" trackVariant="dark" className="text-secondary" />
    </div>
  </div>
);

interface BalanceCellProps {
  label: string;
  amount: BigNumber | null;
  subAmount: BigNumber;
  highlighted?: boolean;
  amountLessThanThreshold?: number;
  subAlwaysGrey?: boolean;
  subTippyContent?: string;
}

const BalanceCell: FC<BalanceCellProps> = ({
  label,
  amount,
  subAmount,
  highlighted,
  amountLessThanThreshold,
  subAlwaysGrey,
  subTippyContent
}) => {
  const isSubPositive = subAmount.isGreaterThan(0);
  const subColorClass = !subAlwaysGrey && isSubPositive ? 'text-success' : 'text-grey-1';
  const subTippyRef = useTippy<HTMLSpanElement>({
    trigger: 'mouseenter',
    hideOnClick: false,
    content: subTippyContent ?? '',
    animation: 'shift-away-subtle',
    placement: 'top-start' as const
  });

  return (
    <div className={`flex-1 rounded-8 px-2 py-3 flex flex-col gap-2 ${highlighted ? 'bg-white' : ''}`}>
      <span className="text-font-description-bold text-grey-1">{label}</span>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-baseline gap-1 text-font-num-bold-16 text-text">
          <BalanceAmount value={amount ?? new BigNumber(0)} lessThanThreshold={amountLessThanThreshold} />
          <span>USDT</span>
        </div>
        <span
          ref={subTippyContent ? subTippyRef : undefined}
          className={`text-font-num-12 ${subColorClass} ${subTippyContent ? 'self-start cursor-pointer' : ''}`}
        >
          {isSubPositive && '+'}
          {subTippyContent ? toLocalFormat(subAmount, { decimalPlaces: 2 }) : <BalanceAmount value={subAmount} />}
        </span>
      </div>
    </div>
  );
};
