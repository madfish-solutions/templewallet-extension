import { FC } from 'react';

import clsx from 'clsx';

import { T } from 'lib/i18n';
import { formatDuration } from 'lib/i18n/core';
import { ONE_DAY_SECONDS } from 'lib/utils/numbers';

interface Props {
  daysRemaining: number;
  className?: string;
}

export const DoubleRewardsWidgetFooter: FC<Props> = ({ daysRemaining, className }) => (
  <div className={clsx('bg-warning-low p-2 flex gap-1 justify-center text-font-num-10', className)}>
    <T id="doubleRewardsEngagementFooter" substitutions={formatDuration(daysRemaining * ONE_DAY_SECONDS, ['days'])} />
  </div>
);
