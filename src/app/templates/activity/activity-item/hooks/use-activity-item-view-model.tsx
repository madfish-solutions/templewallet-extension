import React, { useCallback, useMemo, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import { AllowanceInteractionActivity, Route3Activity, TzktOperationStatus } from '@temple-wallet/transactions-parser';
import classNames from 'clsx';

import { getCurrentLocale, t } from 'lib/i18n';
import { formatDateOutput } from 'lib/notifications/utils/date.utils';
import { DisplayableActivity } from 'lib/temple/activity-new/types';
import { getActor, getActivityTypeFlags } from 'lib/temple/activity-new/utils';
import { useExplorerBaseUrls } from 'lib/temple/front';
import { formatTcInfraImgUri } from 'lib/temple/front/image-uri';
import { Image } from 'lib/ui/Image';

import Route3Logo from '../../assets/3route.png';
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

const actorAvatarStyles = 'border border-gray-300 mr-2 rounded-md min-w-9';

export const useActivityItemViewModel = (activity: DisplayableActivity) => {
  const { hash, timestamp, status, tokensDeltas, from } = activity;

  const { transaction: explorerBaseUrl } = useExplorerBaseUrls();
  const [isOpen, setIsOpen] = useState(false);
  const [wasToggled, setWasToggled] = useState(false);

  const { isDelegation, isBakingRewards, isSend, isReceive, isInteraction, is3Route, isAllowanceChange, isRevoke } =
    getActivityTypeFlags(activity);
  const { prepositionI18nKey: actorPrepositionI18nKey, actor } = getActor(activity);
  const shouldShowBaker = (isDelegation || isBakingRewards) && isDefined(actor);
  const shouldShowActor = isDelegation || isBakingRewards || isSend || isReceive || isAllowanceChange;
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

    if (is3Route) {
      return (
        <div className={classNames('flex items-center justify-center', actorAvatarStyles)}>
          <img src={Route3Logo} alt="3Route logo" height={12} width={24} />
        </div>
      );
    }

    if (isInteraction) {
      return null;
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
  }, [actor?.address, isInteraction, robotIconHash, shouldShowBaker, tzProfileLogo, is3Route]);

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
    explorerBaseUrl,
    tokensDeltas
  };
};
