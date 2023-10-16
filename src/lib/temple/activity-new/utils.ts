import { isDefined } from '@rnw-community/shared';
import {
  ActivitySubtype,
  ActivityType,
  AllowanceInteractionActivity,
  InteractionActivity,
  isQuipuswapSendParameter
} from '@temple-wallet/transactions-parser';

import { getAssetSymbol, isCollectible } from 'lib/metadata';
import { AssetMetadataBase } from 'lib/metadata/types';

import { DisplayableActivity } from './types';

const MAX_DISPLAYED_TOKEN_SYMBOL_CHARS = 15;

/** Attention! The returned values cannot be used as typeguards yet */
export const getActivityTypeFlags = (activity: DisplayableActivity) => {
  const { type } = activity;

  const isDelegation = type === ActivityType.Delegation;
  const isBakingRewards = type === ActivityType.BakingRewards;
  const isSend = type === ActivityType.Send;
  const isReceive = type === ActivityType.Receive;
  const isInteraction = type === ActivityType.Interaction;
  const is3Route = isInteraction && activity.subtype === ActivitySubtype.Route3;
  const isQuipuswapCoinflip =
    isInteraction &&
    (activity.subtype === ActivitySubtype.QuipuswapCoinflipBet ||
      activity.subtype === ActivitySubtype.QuipuswapCoinflipWin);

  const isQuipuswapAddLiqiudityV1 = isInteraction && activity.subtype === ActivitySubtype.QuipuswapAddLiqiudityV1;
  const isQuipuswapRemoveLiquidityV1 = isInteraction && activity.subtype === ActivitySubtype.QuipuswapRemoveLiquidityV1;
  const isQuipuswapAddLiqiudityV2 = isInteraction && activity.subtype === ActivitySubtype.QuipuswapAddLiqiudityV2;
  const isQuipuswapRemoveLiquidityV2 = isInteraction && activity.subtype === ActivitySubtype.QuipuswapRemoveLiquidityV2;
  const isQuipuswapAddLiqiudityV3 = isInteraction && activity.subtype === ActivitySubtype.QuipuswapAddLiqiudityV3;
  const isQuipuswapRemoveLiquidityV3 = isInteraction && activity.subtype === ActivitySubtype.QuipuswapRemoveLiquidityV3;
  const isQuipuswapAddLiqiudityStableswap =
    isInteraction && activity.subtype === ActivitySubtype.QuipuswapAddLiquidityStableswap;
  const isQuipuswapRemoveLiquidityStableswap =
    isInteraction && activity.subtype === ActivitySubtype.QuipuswapRemoveLiquidityStableswap;
  const isQuipuswapInvestInDividends = isInteraction && activity.subtype === ActivitySubtype.QuipuswapInvestInDividends;
  const isQuipuswapDivestFromDividends =
    isInteraction && activity.subtype === ActivitySubtype.QuipuswapDivestFromDividends;
  const isQuipuswapInvestInFarm = isInteraction && activity.subtype === ActivitySubtype.QuipuswapInvestInFarm;
  const isQuipuswapDivestFromFarm = isInteraction && activity.subtype === ActivitySubtype.QuipuswapDivestFromFarm;
  const isQuipuswapHarvestFromFarm = isInteraction && activity.subtype === ActivitySubtype.QuipuswapHarvestFromFarm;
  const isQuipuswapHarvestFromDividends =
    isInteraction && activity.subtype === ActivitySubtype.QuipuswapHarvestFromDividends;
  const isQuipuswapSend = isInteraction && activity.subtype === ActivitySubtype.QuipuswapSend;
  const isQuipuswapReceive = isInteraction && activity.subtype === ActivitySubtype.QuipuswapReceive;

  const isAllowanceChange = isInteraction && activity.subtype === ActivitySubtype.ChangeAllowance;
  const isRevoke = isAllowanceChange && Boolean(activity.allowanceChanges[0]?.atomicAmount.isZero());

  return {
    isDelegation,
    isBakingRewards,
    isSend,
    isReceive,
    isInteraction,
    is3Route,
    isAllowanceChange,
    isRevoke,
    quipuswap: {
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
    }
  };
};

export const isInteractionActivityTypeGuard = (activity: DisplayableActivity): activity is InteractionActivity =>
  activity.type === ActivityType.Interaction;

export const isAllowanceInteractionActivityTypeGuard = (
  activity: DisplayableActivity
): activity is AllowanceInteractionActivity =>
  isInteractionActivityTypeGuard(activity) && activity.subtype === ActivitySubtype.ChangeAllowance;

export const getAssetSymbolOrName = (metadata: AssetMetadataBase | undefined) => {
  const fullSymbolOrName =
    isDefined(metadata) && isCollectible(metadata) ? metadata.name : getAssetSymbol(metadata, false);

  return fullSymbolOrName.length > MAX_DISPLAYED_TOKEN_SYMBOL_CHARS
    ? `${fullSymbolOrName.slice(0, MAX_DISPLAYED_TOKEN_SYMBOL_CHARS)}…`
    : fullSymbolOrName;
};

export const getActor = (activity: DisplayableActivity) => {
  const { isAllowanceChange, isRevoke, isSend, isDelegation, quipuswap } = getActivityTypeFlags(activity);
  const { isQuipuswapSend, isQuipuswapReceive } = quipuswap;

  if (isAllowanceChange) {
    const firstAllowanceChange = (activity as AllowanceInteractionActivity).allowanceChanges[0];

    return {
      prepositionI18nKey: isRevoke ? ('from' as const) : ('toAsset' as const),
      actor: isDefined(firstAllowanceChange) ? { address: firstAllowanceChange.spenderAddress } : activity.to
    };
  }

  if (isQuipuswapSend && isQuipuswapSendParameter(activity.parameter)) {
    return {
      prepositionI18nKey: 'toAsset' as const,
      actor: { address: activity.parameter.value.receiver }
    };
  }

  if (isQuipuswapReceive) {
    return {
      prepositionI18nKey: 'from' as const,
      actor: activity.initiator
    };
  }

  return {
    prepositionI18nKey: isSend || isDelegation ? ('toAsset' as const) : ('from' as const),
    actor: isSend || isDelegation ? activity.to : activity.from
  };
};

const QuipuswapSubtypes = [
  ActivitySubtype.QuipuswapCoinflipBet,
  ActivitySubtype.QuipuswapCoinflipWin,
  ActivitySubtype.QuipuswapAddLiqiudityV1,
  ActivitySubtype.QuipuswapRemoveLiquidityV1,
  ActivitySubtype.QuipuswapAddLiqiudityV2,
  ActivitySubtype.QuipuswapRemoveLiquidityV2,
  ActivitySubtype.QuipuswapAddLiqiudityV3,
  ActivitySubtype.QuipuswapRemoveLiquidityV3,
  ActivitySubtype.QuipuswapAddLiquidityStableswap,
  ActivitySubtype.QuipuswapRemoveLiquidityStableswap,
  ActivitySubtype.QuipuswapInvestInDividends,
  ActivitySubtype.QuipuswapDivestFromDividends,
  ActivitySubtype.QuipuswapInvestInFarm,
  ActivitySubtype.QuipuswapDivestFromFarm,
  ActivitySubtype.QuipuswapHarvestFromFarm,
  ActivitySubtype.QuipuswapHarvestFromDividends,
  ActivitySubtype.QuipuswapSend,
  ActivitySubtype.QuipuswapReceive
];

export const isQuipuswapSubtype = (subtype: ActivitySubtype) => QuipuswapSubtypes.includes(subtype);
