import React, { useMemo, useState, memo, useCallback } from 'react';

import { isDefined } from '@rnw-community/shared';
import {
  Activity,
  ActivityType,
  ActivitySubtype,
  AllowanceInteractionActivity,
  TzktOperationStatus
} from '@temple-wallet/transactions-parser';
import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import HashShortView from 'app/atoms/HashShortView';
import OpenInExplorerChip from 'app/atoms/OpenInExplorerChip';
import { ReactComponent as AlertNewIcon } from 'app/icons/alert-new.svg';
import { ReactComponent as ChevronUpNewIcon } from 'app/icons/chevron-up-new.svg';
import AddressChip from 'app/templates/AddressChip';
import HashChip from 'app/templates/HashChip';
import { T, getCurrentLocale, t } from 'lib/i18n';
import { formatDateOutput } from 'lib/notifications/utils/date.utils';
import { DisplayableActivity } from 'lib/temple/activity-new/types';
import { useExplorerBaseUrls } from 'lib/temple/front';
import useTippy from 'lib/ui/useTippy';

import { ActivityDetailsRow } from './activity-details-row';
import styles from './activity-item.module.css';
import { BakerLogo } from './baker-logo';
import { BakerName } from './baker-name';
import { RobotIcon } from './robot-icon';
import { ActivitySelectors } from './selectors';
import { TokensAllowancesView } from './tokens-allowances-view';
import { FilteringMode, TokensDeltaView } from './tokens-delta-view';

interface Props {
  activity: DisplayableActivity;
}

const statusesColors = {
  [TzktOperationStatus.Applied]: 'bg-green-500',
  [TzktOperationStatus.Backtracked]: 'bg-red-700',
  [TzktOperationStatus.Failed]: 'bg-red-700',
  [TzktOperationStatus.Pending]: 'bg-gray-20',
  [TzktOperationStatus.Skipped]: 'bg-red-700'
};

const activityTypesI18nKeys = {
  [ActivityType.Send]: 'send' as const,
  [ActivityType.Recieve]: 'receive' as const,
  [ActivityType.Delegation]: 'delegation' as const,
  [ActivityType.BakingRewards]: 'bakerRewards' as const,
  [ActivityType.Interaction]: 'interaction' as const
};

const renderAddressChipFromDetails = (accountPkh: string) => (
  <AddressChip
    pkh={accountPkh}
    testID={ActivitySelectors.addressFromDetailsButton}
    addressModeSwitchTestID={ActivitySelectors.addressModeSwitchButton}
    rounded="base"
    chipClassName={styles.hashChip}
  />
);

const renderHashChipFromDetails = (accountPkh: string, explorerBaseUrl?: string) => (
  <>
    <HashChip
      className={classNames(styles.hashChip, explorerBaseUrl && 'mr-1')}
      hash={accountPkh}
      rounded="base"
      testID={ActivitySelectors.addressFromDetailsButton}
    />
    {explorerBaseUrl && (
      <OpenInExplorerChip
        baseUrl={explorerBaseUrl}
        hash={accountPkh}
        testID={ActivitySelectors.openAddressInExplorerButton}
      />
    )}
  </>
);

const isAllowanceChange = (activity: Activity): activity is AllowanceInteractionActivity =>
  activity.type === ActivityType.Interaction && activity.subtype === ActivitySubtype.ChangeAllowance;

export const ActivityItem = memo<Props>(({ activity }) => {
  const { hash, timestamp, status, type, tokensDeltas, from, to } = activity;

  const locale = getCurrentLocale();
  const jsLocaleName = locale.replaceAll('_', '-');
  const { transaction: explorerBaseUrl } = useExplorerBaseUrls();
  const [isOpen, setIsOpen] = useState(false);
  const [wasToggled, setWasToggled] = useState(false);

  const isDelegation = type === ActivityType.Delegation;
  const isBakingRewards = type === ActivityType.BakingRewards;
  const isSend = type === ActivityType.Send;
  const isReceive = type === ActivityType.Recieve;
  const isInteraction = type === ActivityType.Interaction;
  const isAllowance = isAllowanceChange(activity);
  const isRevoke = isAllowance && Boolean(activity.allowanceChanges[0]?.atomicAmount.isZero());
  const { actorPrepositionI18nKey, actor } = useMemo(() => {
    if (isAllowance) {
      const firstAllowanceChange = activity.allowanceChanges[0];

      return {
        actorPrepositionI18nKey: isRevoke ? ('from' as const) : ('toAsset' as const),
        actor: isDefined(firstAllowanceChange) ? { address: firstAllowanceChange.spenderAddress } : activity.to
      };
    }

    return {
      actorPrepositionI18nKey: isSend || isDelegation ? ('toAsset' as const) : ('from' as const),
      actor: isSend || isDelegation ? activity.to : activity.from
    };
  }, [activity, isSend, isDelegation, isRevoke, isAllowance]);
  const shouldShowBaker = (isDelegation || isBakingRewards) && isDefined(actor);
  const shouldShowActor = isDelegation || isBakingRewards || isSend || isReceive || isAllowance;
  const shouldShowActorAddressInSubtitle = (isSend || isReceive || isAllowance) && isDefined(actor);

  const interactionTooltipRef = useTippy<HTMLSpanElement>({
    trigger: 'mouseenter',
    hideOnClick: false,
    content: t('interactionTypeTooltip'),
    animation: 'shift-away-subtle'
  });

  const receivedTokensDeltas = useMemo(
    () => tokensDeltas.filter(({ atomicAmount }) => atomicAmount.gt(0)),
    [tokensDeltas]
  );
  const sentTokensDeltas = useMemo(() => tokensDeltas.filter(({ atomicAmount }) => atomicAmount.lt(0)), [tokensDeltas]);

  const toggleDetails = useCallback(() => {
    setIsOpen(value => !value);
    setWasToggled(true);
  }, []);

  return (
    <div className="py-3 flex flex-col gap-3 w-full">
      <div className={classNames('w-full flex', !isInteraction && 'items-center')}>
        {shouldShowBaker && <BakerLogo bakerAddress={actor.address} />}
        {!shouldShowBaker && !isInteraction && (
          <RobotIcon hash={actor?.address ?? from.address} className="border border-gray-300 mr-2" />
        )}

        <div className="flex-1">
          <p className="text-sm font-medium leading-tight text-gray-910 flex items-center">
            {isRevoke && <T id="revoke" />}
            {!isRevoke && <T id={isAllowance ? 'approve' : activityTypesI18nKeys[type]} />}
            {isInteraction && !isAllowance && (
              <span ref={interactionTooltipRef} className="inline-block ml-1 text-gray-500">
                <AlertNewIcon className="w-4 h-4 stroke-current" />
              </span>
            )}
          </p>
          <p className="text-xs leading-5 text-gray-600">
            {shouldShowActor && (
              <span className="mr-1">
                <T id={actorPrepositionI18nKey} />:
              </span>
            )}
            {shouldShowActorAddressInSubtitle && (
              <HashShortView firstCharsCount={5} lastCharsCount={5} hash={actor.address} />
            )}
            {shouldShowBaker && <BakerName bakerAddress={actor.address} />}
            {!shouldShowActorAddressInSubtitle && !shouldShowBaker && '‒'}
          </p>
        </div>

        <div>
          {isAllowance ? (
            <TokensAllowancesView allowancesChanges={activity.allowanceChanges} />
          ) : (
            <TokensDeltaView
              tokensDeltas={tokensDeltas}
              shouldShowNFTCard={false}
              isTotal
              filteringMode={isInteraction ? FilteringMode.ONLY_POSITIVE_IF_PRESENT : FilteringMode.NONE}
            />
          )}
        </div>
      </div>

      <div className="w-full flex items-center">
        <div className={classNames('px-0.5 rounded-lg h-4 flex items-center mr-1 font-medium', statusesColors[status])}>
          <span className="px-1 text-2xs leading-none uppercase text-white">
            <T id={status} />
          </span>
        </div>
        <span className="flex-1 text-2xs font-medium text-gray-600">
          {formatDateOutput(timestamp, jsLocaleName, {
            hour: '2-digit',
            minute: 'numeric',
            second: 'numeric',
            hour12: false
          })}
        </span>
        <Button
          testID={ActivitySelectors.detailsButton}
          onClick={toggleDetails}
          className="p-1 rounded bg-gray-100 text-gray-600"
        >
          <ChevronUpNewIcon
            className={classNames(
              'w-4 h-4 stroke-current',
              wasToggled && styles[isOpen ? 'openDetailsIcon' : 'closeDetailsIcon']
            )}
          />
        </Button>
      </div>

      {isOpen && (
        <div className="w-full px-3 rounded-lg border border-gray-300">
          {isAllowance && activity.allowanceChanges.length > 0 && (
            <ActivityDetailsRow
              className="border-b border-gray-300"
              title={
                <>
                  <T id={isRevoke ? 'revoked' : 'approved'} />:
                </>
              }
            >
              <TokensAllowancesView allowancesChanges={activity.allowanceChanges} />
            </ActivityDetailsRow>
          )}

          {receivedTokensDeltas.length > 0 && (
            <ActivityDetailsRow className="border-b border-gray-300" title={<T id="received" />}>
              <div className="flex flex-col items-right">
                {receivedTokensDeltas.map((tokenDelta, i) => (
                  <TokensDeltaView key={i} tokensDeltas={tokenDelta} shouldShowNFTCard isTotal={false} />
                ))}
              </div>
            </ActivityDetailsRow>
          )}

          {sentTokensDeltas.length > 0 && (
            <ActivityDetailsRow className="border-b border-gray-300" title={<T id="sent" />}>
              <div className="flex flex-col items-right">
                {sentTokensDeltas.map((tokenDelta, i) => (
                  <TokensDeltaView key={i} tokensDeltas={tokenDelta} shouldShowNFTCard isTotal={false} />
                ))}
              </div>
            </ActivityDetailsRow>
          )}

          {shouldShowActor && (
            <ActivityDetailsRow
              className="items-center border-b border-gray-300"
              title={
                <>
                  <T id={actorPrepositionI18nKey} />:
                </>
              }
            >
              {isDelegation && isDefined(to) && renderHashChipFromDetails(to.address, explorerBaseUrl)}
              {isSend && isDefined(to) && renderAddressChipFromDetails(to.address)}
              {isReceive && renderAddressChipFromDetails(from.address)}
              {isBakingRewards && renderHashChipFromDetails(from.address, explorerBaseUrl)}
              {isAllowance && isDefined(actor) && renderHashChipFromDetails(actor.address, explorerBaseUrl)}
              {(((isSend || isDelegation) && !isDefined(to)) || (isAllowance && !isDefined(actor))) && (
                <span className="text-gray-500 text-xs leading-5">‒</span>
              )}
            </ActivityDetailsRow>
          )}

          <ActivityDetailsRow className="items-center" title={<T id="txHash" />}>
            <HashChip
              hash={hash}
              firstCharsCount={10}
              lastCharsCount={7}
              className={classNames('mr-1', styles.hashChip)}
            />

            {explorerBaseUrl && (
              <OpenInExplorerChip
                baseUrl={explorerBaseUrl}
                hash={hash}
                testID={ActivitySelectors.openTransactionInExplorerButton}
              />
            )}
          </ActivityDetailsRow>
        </div>
      )}
    </div>
  );
});
