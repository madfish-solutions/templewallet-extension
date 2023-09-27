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
  const {
    isSend,
    isReceive,
    is3Route,
    isAllowanceChange,
    isDelegation,
    isBakingRewards,
    isQuipuswapCoinflip,
    isQuipuswapAddLiqiudityV1,
    isQuipuswapRemoveLiquidityV1,
    isQuipuswapAddLiqiudityV2,
    isQuipuswapRemoveLiquidityV2,
    isQuipuswapAddLiqiudityV3,
    isQuipuswapRemoveLiquidityV3,
    isQuipuswapAddLiqiudityStableswap,
    isQuipuswapRemoveLiquidityStableswap,
    isQuipuswapInvestInDividents,
    isQuipuswapDivestFromDividents,
    isQuipuswapInvestInFarm,
    isQuipuswapDivestFromFarm,
    isQuipuswapHarvestFromFarm,
    isQuipuswapHarvestFromDividents
  } = getActivityTypeFlags(activity);
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
  } else if (isQuipuswapCoinflip) {
    secondPart = <T id="coinflip" />;
  } else if (isQuipuswapAddLiqiudityV1) {
    secondPart = <T id="addLiqiudityV1" />;
  } else if (isQuipuswapRemoveLiquidityV1) {
    secondPart = <T id="removeLiqiudityV1" />;
  } else if (isQuipuswapAddLiqiudityV2) {
    secondPart = <T id="addLiqiudityV2" />;
  } else if (isQuipuswapRemoveLiquidityV2) {
    secondPart = <T id="removeLiqiudityV2" />;
  } else if (isQuipuswapAddLiqiudityV3) {
    secondPart = <T id="addLiqiudityV3" />;
  } else if (isQuipuswapRemoveLiquidityV3) {
    secondPart = <T id="removeLiqiudityV3" />;
  } else if (isQuipuswapAddLiqiudityStableswap) {
    secondPart = <T id="addLiqiudityStableswap" />;
  } else if (isQuipuswapRemoveLiquidityStableswap) {
    secondPart = <T id="removeLiqiudityStableswap" />;
  } else if (isQuipuswapInvestInDividents) {
    secondPart = <T id="investInDividents" />;
  } else if (isQuipuswapDivestFromDividents) {
    secondPart = <T id="divestFromDividents" />;
  } else if (isQuipuswapInvestInFarm) {
    secondPart = <T id="investInFarm" />;
  } else if (isQuipuswapDivestFromFarm) {
    secondPart = <T id="divestFromFarm" />;
  } else if (isQuipuswapHarvestFromFarm) {
    secondPart = <T id="harvestFromFarm" />;
  } else if (isQuipuswapHarvestFromDividents) {
    secondPart = <T id="harvestFromDividents" />;
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
