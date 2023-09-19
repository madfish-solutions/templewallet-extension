import React, { FC, memo, ReactNode } from 'react';

import { isDefined } from '@rnw-community/shared';

import HashShortView from 'app/atoms/HashShortView';
import { T } from 'lib/i18n';
import { DisplayableActivity } from 'lib/temple/activity-new/types';
import { getActivityTypeFlags, getActor } from 'lib/temple/activity-new/utils';

import { BakerName } from '../baker-name';

interface Props {
  activity: DisplayableActivity;
}

export const ActivitySubtitle: FC<Props> = memo(({ activity }) => {
  const { prepositionI18nKey, actor } = getActor(activity);
  const { isSend, isReceive, is3Route, isAllowanceChange, isDelegation, isBakingRewards } =
    getActivityTypeFlags(activity);
  const shouldShowActorAddressInSubtitle = (isSend || isReceive || isAllowanceChange) && isDefined(actor);
  const shouldShowBaker = (isDelegation || isBakingRewards) && isDefined(actor);
  const shouldShowActor = isDelegation || isBakingRewards || isSend || isReceive || isAllowanceChange;

  let secondPart: string | ReactNode;
  if (shouldShowActorAddressInSubtitle) {
    secondPart = <HashShortView firstCharsCount={5} lastCharsCount={5} hash={actor.address} />;
  } else if (shouldShowBaker) {
    secondPart = <BakerName bakerAddress={actor.address} />;
  } else if (is3Route) {
    secondPart = <T id="swapTokens" />;
  } else {
    secondPart = '‒';
  }

  return (
    <p className="text-xs leading-5 text-gray-600">
      {shouldShowActor && (
        <span className="mr-1">
          <T id={prepositionI18nKey} />:
        </span>
      )}
      {secondPart}
    </p>
  );
});
