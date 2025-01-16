import React, { FC, PropsWithChildren, ReactNode } from 'react';

import clsx from 'clsx';

import { ReactComponent as InfoIcon } from 'app/icons/info.svg';

import { RewardsTooltip } from './tooltip';

interface SectionProps {
  title: ReactNode | ReactNode[];
  tooltipText?: string;
  tooltipTriggerTestID?: string;
}

export const Section: FC<PropsWithChildren<SectionProps>> = ({
  title,
  tooltipText,
  tooltipTriggerTestID,
  children
}) => (
  <div className="flex flex-col gap-3">
    <div className={clsx('flex justify-between items-center', !tooltipText && 'mb-1')}>
      <span className="text-gray-700 text-base leading-tight font-medium">{title}</span>

      {tooltipText && (
        <RewardsTooltip placement="bottom-end" content={tooltipText} testID={tooltipTriggerTestID} Icon={InfoIcon} />
      )}
    </div>

    {children}
  </div>
);
