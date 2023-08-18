import React, { memo } from 'react';

import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import OpenInExplorerChip from 'app/atoms/OpenInExplorerChip';
import { ReactComponent as ChevronUpNewIcon } from 'app/icons/chevron-up-new.svg';
import HashChip from 'app/templates/HashChip';
import { T, t } from 'lib/i18n';
import { DisplayableActivity } from 'lib/temple/activity-new/types';

import { ActivitySelectors } from '../selectors';
import { TokensAllowancesView } from '../tokens-allowances-view';
import { TokensDeltaView } from '../tokens-delta-view';
import { ActivityDetailsRow } from './activity-details-row';
import styles from './activity-item.module.css';
import { ActivitySubtitle } from './activity-subtitle';
import { ActivityTypeView } from './activity-type-view';
import { ActorChip } from './actor-chip';
import { useActivityItemViewModel } from './use-activity-item-view-model';

interface Props {
  activity: DisplayableActivity;
}

export const ActivityItem = memo<Props>(({ activity }) => {
  const {
    firstRowClassName,
    actorAvatar,
    headerTokensDeltasFilteringMode,
    statusColorClassName,
    status,
    isAllowanceChange,
    allowanceChanges,
    activityTime,
    chevronAnimationClassName,
    toggleDetails,
    isOpen,
    shouldShowAllowanceRow,
    allowanceRowTitle,
    receivedTokensDeltas,
    sentTokensDeltas,
    shouldShowActor,
    actorPrepositionI18nKey,
    hash,
    explorerBaseUrl,
    tokensDeltas
  } = useActivityItemViewModel(activity);

  return (
    <div className="py-3 flex flex-col gap-3 w-full">
      <div className={firstRowClassName}>
        {actorAvatar}

        <div className="flex-1">
          <ActivityTypeView activity={activity} />
          <ActivitySubtitle activity={activity} />
        </div>

        <div>
          {isAllowanceChange ? (
            <TokensAllowancesView allowancesChanges={allowanceChanges} />
          ) : (
            <TokensDeltaView
              tokensDeltas={tokensDeltas}
              shouldShowNFTCard={false}
              isTotal
              filteringMode={headerTokensDeltasFilteringMode}
            />
          )}
        </div>
      </div>

      <div className="w-full flex items-center">
        <div className={classNames('px-0.5 rounded-lg h-4 flex items-center mr-1 font-medium', statusColorClassName)}>
          <span className="px-1 text-2xs leading-none uppercase text-white">
            <T id={status} />
          </span>
        </div>
        <span className="flex-1 text-2xs font-medium text-gray-600">{activityTime}</span>
        <Button
          testID={ActivitySelectors.detailsButton}
          onClick={toggleDetails}
          className="p-1 rounded bg-gray-100 text-gray-600"
        >
          <ChevronUpNewIcon className={classNames('w-4 h-4 stroke-current', chevronAnimationClassName)} />
        </Button>
      </div>

      {isOpen && (
        <div className="w-full px-3 rounded-lg border border-gray-300">
          {shouldShowAllowanceRow && (
            <ActivityDetailsRow className="border-b border-gray-300" title={allowanceRowTitle}>
              <TokensAllowancesView allowancesChanges={allowanceChanges} />
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
              title={`${t(actorPrepositionI18nKey)}:`}
            >
              <ActorChip activity={activity} />
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
