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
  const { isSend, isReceive, is3Route, isAllowanceChange, isDelegation, isBakingRewards, quipuswap } =
    getActivityTypeFlags(activity);
  const {
    isQuipuswapCoinflip,
    isQuipuswapAddLiqiudityV1,
    isQuipuswapRemoveLiquidityV1,
    isQuipuswapAddLiqiudityV2,
    isQuipuswapRemoveLiquidityV2,
    isQuipuswapAddLiqiudityV3,
    isQuipuswapRemoveLiquidityV3,
    isQuipuswapAddLiqiudityStableswap,
    isQuipuswapRemoveLiquidityStableswap,
    isQuipuswapInvestInDividends,
    isQuipuswapDivestFromDividends,
    isQuipuswapInvestInFarm,
    isQuipuswapDivestFromFarm,
    isQuipuswapHarvestFromFarm,
    isQuipuswapHarvestFromDividends,
    isQuipuswapSend,
    isQuipuswapReceive
  } = quipuswap;
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
    secondPart = <T id="investInV1" />;
  } else if (isQuipuswapRemoveLiquidityV1) {
    secondPart = <T id="divestFromV1" />;
  } else if (isQuipuswapAddLiqiudityV2) {
    secondPart = <T id="investInV2" />;
  } else if (isQuipuswapRemoveLiquidityV2) {
    secondPart = <T id="divestFromV2" />;
  } else if (isQuipuswapAddLiqiudityV3) {
    secondPart = <T id="investInV3" />;
  } else if (isQuipuswapRemoveLiquidityV3) {
    secondPart = <T id="divestFromV3" />;
  } else if (isQuipuswapAddLiqiudityStableswap) {
    secondPart = <T id="investInStableswap" />;
  } else if (isQuipuswapRemoveLiquidityStableswap) {
    secondPart = <T id="divestFromStableswap" />;
  } else if (isQuipuswapInvestInDividends) {
    secondPart = <T id="investInDividends" />;
  } else if (isQuipuswapDivestFromDividends) {
    secondPart = <T id="divestFromDividends" />;
  } else if (isQuipuswapInvestInFarm) {
    secondPart = <T id="stakeToFarm" />;
  } else if (isQuipuswapDivestFromFarm) {
    secondPart = <T id="unstakeFromFarm" />;
  } else if (isQuipuswapHarvestFromFarm) {
    secondPart = <T id="claimRewards" />;
  } else if (isQuipuswapHarvestFromDividends) {
    secondPart = <T id="harvestFromDividends" />;
  } else if (isQuipuswapSend) {
    secondPart = <T id="swapAndSend" />;
  } else if (isQuipuswapReceive) {
    secondPart = <T id="receiveFromSwap" />;
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
