import { isDefined } from '@rnw-community/shared';
import { ActivitySubtype, ActivityType, AllowanceInteractionActivity } from '@temple-wallet/transactions-parser';

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
  const isReceive = type === ActivityType.Recieve;
  const isInteraction = type === ActivityType.Interaction;
  const is3Route = isInteraction && activity.subtype === ActivitySubtype.Route3;
  const isAllowanceChange = isInteraction && activity.subtype === ActivitySubtype.ChangeAllowance;
  const isRevoke = isAllowanceChange && Boolean(activity.allowanceChanges[0]?.atomicAmount.isZero());

  return { isDelegation, isBakingRewards, isSend, isReceive, isInteraction, is3Route, isAllowanceChange, isRevoke };
};

export const getAssetSymbolOrName = (metadata: AssetMetadataBase | undefined) => {
  const fullSymbolOrName =
    isDefined(metadata) && isCollectible(metadata) ? metadata.name : getAssetSymbol(metadata, false);

  return fullSymbolOrName.length > MAX_DISPLAYED_TOKEN_SYMBOL_CHARS
    ? `${fullSymbolOrName.slice(0, MAX_DISPLAYED_TOKEN_SYMBOL_CHARS)}…`
    : fullSymbolOrName;
};

export const getActor = (activity: DisplayableActivity) => {
  const { isAllowanceChange, isRevoke, isSend, isDelegation } = getActivityTypeFlags(activity);

  if (isAllowanceChange) {
    const firstAllowanceChange = (activity as AllowanceInteractionActivity).allowanceChanges[0];

    return {
      prepositionI18nKey: isRevoke ? ('from' as const) : ('toAsset' as const),
      actor: isDefined(firstAllowanceChange) ? { address: firstAllowanceChange.spenderAddress } : activity.to
    };
  }

  return {
    prepositionI18nKey: isSend || isDelegation ? ('toAsset' as const) : ('from' as const),
    actor: isSend || isDelegation ? activity.to : activity.from
  };
};
