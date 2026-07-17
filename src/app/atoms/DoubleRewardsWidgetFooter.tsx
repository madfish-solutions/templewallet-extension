import { FC } from 'react';

import clsx from 'clsx';

import { T } from 'lib/i18n';

interface Props {
  daysRemaining: number;
  className?: string;
}

export const DoubleRewardsWidgetFooter: FC<Props> = ({ daysRemaining, className }) => (
  <div className={clsx('bg-warning-low p-2 flex gap-1 justify-center text-font-num-10', className)}>
    <span className="font-medium">
      <T id="doubleRewardsEngagementFooterTitle" />
    </span>
    <span className="text-grey-1">
      <T
        id={daysRemaining === 1 ? 'doubleRewardsEngagementFooterDayLeft' : 'doubleRewardsEngagementFooterDaysLeft'}
        substitutions={daysRemaining}
      />
    </span>
  </div>
);
