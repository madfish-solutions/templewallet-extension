import React, { FC, ReactNode } from 'react';

import { ActivityType } from '@temple-wallet/transactions-parser';

import { ReactComponent as AlertNewIcon } from 'app/icons/alert-new.svg';
import { T, t } from 'lib/i18n';
import { DisplayableActivity } from 'lib/temple/activity-new/types';
import { getActivityTypeFlags } from 'lib/temple/activity-new/utils';
import useTippy from 'lib/ui/useTippy';

interface Props {
  activity: DisplayableActivity;
}

const activityTypesI18nKeys = {
  [ActivityType.Send]: 'send' as const,
  [ActivityType.Recieve]: 'receive' as const,
  [ActivityType.Delegation]: 'delegation' as const,
  [ActivityType.BakingRewards]: 'bakerRewards' as const,
  [ActivityType.Interaction]: 'interaction' as const
};

export const ActivityTypeView: FC<Props> = ({ activity }) => {
  const { isAllowanceChange, isInteraction, isRevoke, is3Route } = getActivityTypeFlags(activity);

  const interactionTooltipRef = useTippy<HTMLSpanElement>({
    trigger: 'mouseenter',
    hideOnClick: false,
    content: t('interactionTypeTooltip'),
    animation: 'shift-away-subtle'
  });

  let contents: ReactNode;

  if (isRevoke) {
    contents = <T id="revoke" />;
  } else if (isAllowanceChange) {
    contents = <T id="approve" />;
  } else {
    contents = (
      <>
        <T id={is3Route ? 'route3' : activityTypesI18nKeys[activity.type]} />
        {isInteraction && !is3Route && (
          <span ref={interactionTooltipRef} className="inline-block ml-1 text-gray-500">
            <AlertNewIcon className="w-4 h-4 stroke-current" />
          </span>
        )}
      </>
    );
  }

  return <p className="text-sm font-medium leading-tight text-gray-910 flex items-center">{contents}</p>;
};
