import React, { useMemo, useState, memo, useCallback } from 'react';

import { isDefined } from '@rnw-community/shared';
import { ActivityType, TzktOperationStatus } from '@temple-wallet/transactions-parser';
import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import HashShortView from 'app/atoms/HashShortView';
import OpenInExplorerChip from 'app/atoms/OpenInExplorerChip';
import { ReactComponent as ChevronUpNewIcon } from 'app/icons/chevron-up-new.svg';
import AddressChip from 'app/templates/AddressChip';
import HashChip from 'app/templates/HashChip';
import { T, getCurrentLocale } from 'lib/i18n';
import { formatDateOutput } from 'lib/notifications/utils/date.utils';
import { DisplayableActivity } from 'lib/temple/activity-new/types';
import { useExplorerBaseUrls } from 'lib/temple/front';

import styles from './activity-item.module.css';
import { BakerLogo } from './baker-logo';
import { BakerName } from './baker-name';
import { RobotIcon } from './robot-icon';
import { ActivitySelectors } from './selectors';
import { TokensDeltaView } from './tokens-delta-view';

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
  [ActivityType.BakingRewards]: 'bakerRewards' as const
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

export const ActivityItem = memo<Props>(({ activity }) => {
  const { hash, timestamp, status, type, tokensDeltas, from, to } = activity;

  const isDelegation = type === ActivityType.Delegation;
  const isBakingRewards = type === ActivityType.BakingRewards;
  const isSend = type === ActivityType.Send;
  const isReceive = type === ActivityType.Recieve;
  const locale = getCurrentLocale();
  const jsLocaleName = locale.replaceAll('_', '-');
  const { transaction: explorerBaseUrl } = useExplorerBaseUrls();
  const [isOpen, setIsOpen] = useState(false);
  const [wasToggled, setWasToggled] = useState(false);

  const receivedTokensDeltas = useMemo(
    () => tokensDeltas.filter(({ atomicAmount }) => atomicAmount.gt(0)),
    [tokensDeltas]
  );
  const sentTokensDeltas = useMemo(() => tokensDeltas.filter(({ atomicAmount }) => atomicAmount.lt(0)), [tokensDeltas]);

  const toggleDetails = useCallback(() => {
    setIsOpen(value => !value);
    setWasToggled(true);
  }, []);

  const actorPrepositionI18nKey = isSend || isDelegation ? 'toAsset' : 'from';
  const actor = isSend || isDelegation ? to : from;

  return (
    <div className="py-3 flex flex-col gap-3 w-full">
      <div className="w-full flex items-center">
        {(isDelegation || isBakingRewards) && isDefined(actor) ? (
          <BakerLogo bakerAddress={actor.address} />
        ) : (
          <RobotIcon hash={actor?.address ?? from.address} className="border border-gray-300 mr-2" />
        )}

        <div className="flex-1">
          <p className="text-sm font-medium leading-tight text-gray-910">
            <T id={activityTypesI18nKeys[type]} />
          </p>
          <p className="text-xs leading-5 text-gray-600">
            <span className="mr-1">
              <T id={actorPrepositionI18nKey} />:
            </span>
            {(isSend || isReceive) && isDefined(actor) && (
              <HashShortView firstCharsCount={5} lastCharsCount={5} hash={actor.address} />
            )}
            {(isDelegation || isBakingRewards) && isDefined(actor) && <BakerName bakerAddress={actor.address} />}
            {!isDefined(actor) && '‒'}
          </p>
        </div>

        <div>
          <TokensDeltaView tokensDeltas={tokensDeltas} shouldShowNFTCard={false} isTotal />
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
          {receivedTokensDeltas.length > 0 && (
            <div className="w-full py-3 flex border-b border-gray-300">
              <span className="flex-1 text-gray-500 text-xs leading-5">
                <T id="received" />
              </span>
              <div className="flex flex-col items-right">
                {receivedTokensDeltas.map((tokenDelta, i) => (
                  <TokensDeltaView key={i} tokensDeltas={tokenDelta} shouldShowNFTCard isTotal={false} />
                ))}
              </div>
            </div>
          )}

          {sentTokensDeltas.length > 0 && (
            <div className="w-full py-3 flex border-b border-gray-300">
              <span className="flex-1 text-gray-500 text-xs leading-5">
                <T id="sent" />
              </span>
              <div className="flex flex-col items-right">
                {sentTokensDeltas.map((tokenDelta, i) => (
                  <TokensDeltaView key={i} tokensDeltas={tokenDelta} shouldShowNFTCard isTotal={false} />
                ))}
              </div>
            </div>
          )}

          {/* TODO: remove 'From/To' row for dApps interactions and unknown operations */}
          <div className="w-full py-3 flex items-center border-b border-gray-300">
            <span className="flex-1 text-gray-500 text-xs leading-5">
              <T id={actorPrepositionI18nKey} />:
            </span>
            {isDelegation && isDefined(to) && renderHashChipFromDetails(to.address, explorerBaseUrl)}
            {isSend && isDefined(to) && renderAddressChipFromDetails(to.address)}
            {(isSend || isDelegation) && !isDefined(to) && <span className="text-gray-500 text-xs leading-5">‒</span>}
            {isReceive && renderAddressChipFromDetails(from.address)}
            {isBakingRewards && renderHashChipFromDetails(from.address, explorerBaseUrl)}
          </div>

          <div className="w-full py-3 flex items-center">
            <span className="flex-1 text-gray-500 text-xs leading-5">
              <T id="txHash" />
            </span>

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
          </div>
        </div>
      )}
    </div>
  );
});
