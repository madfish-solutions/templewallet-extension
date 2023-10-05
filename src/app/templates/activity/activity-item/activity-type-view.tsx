import React, { FC, ReactNode } from 'react';

import { isDefined } from '@rnw-community/shared';
import { ActivitySubtype, ActivityType } from '@temple-wallet/transactions-parser';

import { ReactComponent as AlertNewIcon } from 'app/icons/alert-new.svg';
import { T, t } from 'lib/i18n';
import { DisplayableActivity } from 'lib/temple/activity-new/types';
import {
  getActivityTypeFlags,
  isAllowanceInteractionActivityTypeGuard,
  isInteractionActivityTypeGuard
} from 'lib/temple/activity-new/utils';
import useTippy from 'lib/ui/useTippy';

interface Props {
  activity: DisplayableActivity;
}

const activityTypesI18nKeys = {
  [ActivityType.Send]: 'send' as const,
  [ActivityType.Receive]: 'receive' as const,
  [ActivityType.Delegation]: 'delegation' as const,
  [ActivityType.BakingRewards]: 'bakerRewards' as const,
  [ActivityType.Interaction]: 'interaction' as const
};

const activitySubtypesI18nKeys = {
  [ActivitySubtype.Route3]: 'route3' as const,
  [ActivitySubtype.QuipuswapCoinflipBet]: 'quipuswap' as const,
  [ActivitySubtype.QuipuswapCoinflipWin]: 'quipuswap' as const,
  [ActivitySubtype.QuipuswapAddLiqiudityV1]: 'quipuswap' as const,
  [ActivitySubtype.QuipuswapRemoveLiquidityV1]: 'quipuswap' as const,
  [ActivitySubtype.QuipuswapAddLiqiudityV2]: 'quipuswap' as const,
  [ActivitySubtype.QuipuswapRemoveLiquidityV2]: 'quipuswap' as const,
  [ActivitySubtype.QuipuswapAddLiqiudityV3]: 'quipuswap' as const,
  [ActivitySubtype.QuipuswapRemoveLiquidityV3]: 'quipuswap' as const,
  [ActivitySubtype.QuipuswapAddLiquidityStableswap]: 'quipuswap' as const,
  [ActivitySubtype.QuipuswapRemoveLiquidityStableswap]: 'quipuswap' as const,
  [ActivitySubtype.QuipuswapInvestInDividents]: 'quipuswap' as const,
  [ActivitySubtype.QuipuswapDivestFromDividents]: 'quipuswap' as const,
  [ActivitySubtype.QuipuswapInvestInFarm]: 'quipuswap' as const,
  [ActivitySubtype.QuipuswapDivestFromFarm]: 'quipuswap' as const,
  [ActivitySubtype.QuipuswapHarvestFromFarm]: 'quipuswap' as const,
  [ActivitySubtype.QuipuswapHarvestFromDividents]: 'quipuswap' as const,
  [ActivitySubtype.QuipuswapSend]: 'quipuswap' as const,
  [ActivitySubtype.QuipuswapReceive]: 'quipuswap' as const
};

export const ActivityTypeView: FC<Props> = ({ activity }) => {
  const { isAllowanceChange, isInteraction, isRevoke } = getActivityTypeFlags(activity);

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
  } else if (
    isInteractionActivityTypeGuard(activity) &&
    isDefined(activity.subtype) &&
    !isAllowanceInteractionActivityTypeGuard(activity)
  ) {
    contents = <T id={activitySubtypesI18nKeys[activity.subtype]} />;
  } else {
    contents = (
      <>
        <T id={activityTypesI18nKeys[activity.type]} />
        {isInteraction && (
          <span ref={interactionTooltipRef} className="inline-block ml-1 text-gray-500">
            <AlertNewIcon className="w-4 h-4 stroke-current" />
          </span>
        )}
      </>
    );
  }

  return <p className="text-sm font-medium leading-tight text-gray-910 flex items-center">{contents}</p>;
};
