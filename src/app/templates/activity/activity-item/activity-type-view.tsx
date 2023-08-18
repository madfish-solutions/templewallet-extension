import React, { FC } from 'react';

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
  const { isAllowanceChange, isInteraction, isRevoke } = getActivityTypeFlags(activity);

  const interactionTooltipRef = useTippy<HTMLSpanElement>({
    trigger: 'mouseenter',
    hideOnClick: false,
    content: t('interactionTypeTooltip'),
    animation: 'shift-away-subtle'
  });

  if (isRevoke) {
    return <T id="revoke" />;
  }

  if (isAllowanceChange) {
    return <T id="approve" />;
  }

  return (
    <>
      <T id={activityTypesI18nKeys[activity.type]} />
      {isInteraction && (
        <span ref={interactionTooltipRef} className="inline-block ml-1 text-gray-500">
          <AlertNewIcon className="w-4 h-4 stroke-current" />
        </span>
      )}
    </>
  );
};
