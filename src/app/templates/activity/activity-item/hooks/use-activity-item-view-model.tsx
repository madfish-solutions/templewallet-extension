import React, { useCallback, useMemo, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import {
  ActivitySubtype,
  AllowanceInteractionActivity,
  Route3Activity,
  TzktOperationStatus
} from '@temple-wallet/transactions-parser';
import classNames from 'clsx';

import { getCurrentLocale, t } from 'lib/i18n';
import { formatDateOutput } from 'lib/notifications/utils/date.utils';
import { DisplayableActivity } from 'lib/temple/activity-new/types';
import {
  getActivityTypeFlags,
  getActor,
  isAllowanceInteractionActivityTypeGuard,
  isInteractionActivityTypeGuard,
  isQuipuswapSubtype
} from 'lib/temple/activity-new/utils';
import { formatTcInfraImgUri } from 'lib/temple/front/image-uri';
import { Image } from 'lib/ui/Image';

import Route3LogoSrc from '../../assets/3route.png';
import QuipuswapLogoSrc from '../../assets/quipuswap.png';
import { BakerLogo } from '../../baker-logo';
import { RobotIcon } from '../../robot-icon';
import { FilteringMode } from '../../tokens-delta-view';
import styles from '../activity-item.module.css';
import { useTzProfileLogo } from './use-tz-profile-logo';

const statusesColors = {
  [TzktOperationStatus.Applied]: 'bg-green-500',
  [TzktOperationStatus.Backtracked]: 'bg-red-700',
  [TzktOperationStatus.Failed]: 'bg-red-700',
  [TzktOperationStatus.Pending]: 'bg-gray-20',
  [TzktOperationStatus.Skipped]: 'bg-red-700'
};

const interactionActivitiesLogos = {
  [ActivitySubtype.Route3]: Route3LogoSrc,
  [ActivitySubtype.QuipuswapCoinflipBet]: QuipuswapLogoSrc,
  [ActivitySubtype.QuipuswapCoinflipWin]: QuipuswapLogoSrc,
  [ActivitySubtype.QuipuswapAddLiqiudityV1]: QuipuswapLogoSrc,
  [ActivitySubtype.QuipuswapRemoveLiquidityV1]: QuipuswapLogoSrc,
  [ActivitySubtype.QuipuswapAddLiqiudityV2]: QuipuswapLogoSrc,
  [ActivitySubtype.QuipuswapRemoveLiquidityV2]: QuipuswapLogoSrc,
  [ActivitySubtype.QuipuswapAddLiqiudityV3]: QuipuswapLogoSrc,
  [ActivitySubtype.QuipuswapRemoveLiquidityV3]: QuipuswapLogoSrc,
  [ActivitySubtype.QuipuswapAddLiquidityStableswap]: QuipuswapLogoSrc,
  [ActivitySubtype.QuipuswapRemoveLiquidityStableswap]: QuipuswapLogoSrc,
  [ActivitySubtype.QuipuswapInvestInDividends]: QuipuswapLogoSrc,
  [ActivitySubtype.QuipuswapDivestFromDividends]: QuipuswapLogoSrc,
  [ActivitySubtype.QuipuswapInvestInFarm]: QuipuswapLogoSrc,
  [ActivitySubtype.QuipuswapDivestFromFarm]: QuipuswapLogoSrc,
  [ActivitySubtype.QuipuswapHarvestFromFarm]: QuipuswapLogoSrc,
  [ActivitySubtype.QuipuswapHarvestFromDividends]: QuipuswapLogoSrc,
  [ActivitySubtype.QuipuswapSend]: QuipuswapLogoSrc,
  [ActivitySubtype.QuipuswapReceive]: QuipuswapLogoSrc
};

const actorAvatarStyles = 'border border-gray-300 mr-2 rounded-md min-w-9';

export const useActivityItemViewModel = (activity: DisplayableActivity) => {
  const { hash, timestamp, status, tokensDeltas, from } = activity;

  const [isOpen, setIsOpen] = useState(false);
  const [wasToggled, setWasToggled] = useState(false);

  const {
    isDelegation,
    isBakingRewards,
    isSend,
    isReceive,
    isInteraction,
    is3Route,
    isAllowanceChange,
    isRevoke,
    quipuswap
  } = getActivityTypeFlags(activity);
  const { isQuipuswapSend, isQuipuswapReceive } = quipuswap;
  const { prepositionI18nKey: actorPrepositionI18nKey, actor } = getActor(activity);
  const shouldShowBaker = (isDelegation || isBakingRewards) && isDefined(actor);
  const shouldShowActor =
    isDelegation ||
    isBakingRewards ||
    isSend ||
    isReceive ||
    isQuipuswapSend ||
    isQuipuswapReceive ||
    isAllowanceChange;
  const headerTokensDeltasFilteringMode = isInteraction ? FilteringMode.ONLY_POSITIVE_IF_PRESENT : FilteringMode.NONE;
  const allowanceChanges = isAllowanceChange ? (activity as AllowanceInteractionActivity).allowanceChanges : [];
  const cashback = is3Route ? (activity as Route3Activity).cashback : undefined;

  const tzProfileLogo = useTzProfileLogo(actor?.address);

  const locale = getCurrentLocale();
  const jsLocaleName = locale.replaceAll('_', '-');
  const activityTime = formatDateOutput(timestamp, jsLocaleName, {
    hour: '2-digit',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  });

  const chevronAnimationClassName = wasToggled && styles[isOpen ? 'openDetailsIcon' : 'closeDetailsIcon'];

  const receivedTokensDeltas = useMemo(
    () => tokensDeltas.filter(({ atomicAmount }) => atomicAmount.gt(0)),
    [tokensDeltas]
  );
  const sentTokensDeltas = useMemo(() => tokensDeltas.filter(({ atomicAmount }) => atomicAmount.lt(0)), [tokensDeltas]);

  const robotIconHash = useMemo(() => actor?.address ?? from.address, [actor?.address, from.address]);

  const actorAvatar = useMemo(() => {
    if (shouldShowBaker) {
      return <BakerLogo bakerAddress={actor.address} />;
    }

    if (isInteractionActivityTypeGuard(activity)) {
      const width = isDefined(activity.subtype) && isQuipuswapSubtype(activity.subtype) ? 36 : 24;

      return isDefined(activity.subtype) && !isAllowanceInteractionActivityTypeGuard(activity) ? (
        <div className={classNames('flex items-center justify-center overflow-hidden', actorAvatarStyles)}>
          <img src={interactionActivitiesLogos[activity.subtype]} alt={activity.subtype} height={12} width={width} />
        </div>
      ) : null;
    }

    if (isDefined(tzProfileLogo)) {
      return (
        <Image
          src={formatTcInfraImgUri(tzProfileLogo)}
          loader={<RobotIcon hash={robotIconHash} />}
          fallback={<RobotIcon hash={robotIconHash} />}
          className={actorAvatarStyles}
          height={36}
          width={36}
        />
      );
    }

    return <RobotIcon hash={robotIconHash} className={actorAvatarStyles} />;
  }, [shouldShowBaker, activity, tzProfileLogo, robotIconHash, actor?.address]);

  const toggleDetails = useCallback(() => {
    setIsOpen(value => !value);
    setWasToggled(true);
  }, []);

  return {
    firstRowClassName: classNames('w-full flex', !isInteraction && 'items-center'),
    actorAvatar,
    headerTokensDeltasFilteringMode,
    statusColorClassName: statusesColors[status],
    status,
    isAllowanceChange,
    allowanceChanges,
    cashback,
    activityTime,
    chevronAnimationClassName,
    toggleDetails,
    isOpen,
    shouldShowAllowanceRow: allowanceChanges.length > 0,
    allowanceRowTitle: `${t(isRevoke ? 'revoked' : 'approved')}:`,
    receivedTokensDeltas,
    sentTokensDeltas,
    shouldShowActor,
    actorPrepositionI18nKey,
    hash,
    tokensDeltas
  };
};
