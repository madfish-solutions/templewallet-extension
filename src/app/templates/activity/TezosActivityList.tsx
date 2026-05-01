import React, { memo, useMemo } from 'react';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { CrossChainActivityRow } from 'app/pages/Send/cross-chain/components/CrossChainActivityRow';
import { TezosActivity } from 'lib/activity';
import { TezosActivityOlderThan } from 'lib/activity/tezos/types';
import { isKnownChainId } from 'lib/apis/tzkt/api';
import { useAccount, useAccountAddressForTezos, useTezosChainByChainId } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { TezosActivityComponent } from './ActivityItem';
import { ActivityListView } from './ActivityListView';
import { fetchTezosActivitiesWithCache } from './fetch-activities-with-cache';
import { ActivitiesDateGroup, useGroupingByDate } from './grouping-by-date';
import { RETRY_AFTER_ERROR_TIMEOUT, useActivitiesLoadingLogic } from './loading-logic';
import { useAssetsFromActivitiesCheck } from './use-assets-from-activites-check';
import { useInterleavedFeed } from './use-interleaved-feed';
import { FilterKind, getActivityFilterKind } from './utils';

interface Props {
  tezosChainId: string;
  assetSlug?: string;
  filterKind?: FilterKind;
  onCrossChainExchangeClick?: (id: string) => void;
}

export const TezosActivityList = memo<Props>(({ tezosChainId, assetSlug, filterKind, onCrossChainExchangeClick }) => {
  const currentAccount = useAccount();
  const network = useTezosChainByChainId(tezosChainId);
  const accountAddress = useAccountAddressForTezos();

  if (!network || !accountAddress) throw new DeadEndBoundaryError();

  const { chainId, rpcBaseURL } = network;

  const {
    activities,
    isLoading,
    reachedTheEnd,
    error,
    setActivities,
    setIsLoading,
    setReachedTheEnd,
    setError,
    loadNext
  } = useActivitiesLoadingLogic<TezosActivity>(
    async (initial, signal) => {
      if (!isKnownChainId(chainId)) {
        setIsLoading(false);
        setReachedTheEnd(true);
        return;
      }

      setIsLoading(true);

      const currActivities = initial ? [] : activities;

      const olderThan: TezosActivityOlderThan | undefined = currActivities.at(-1);

      try {
        const { activities: newActivities } = await fetchTezosActivitiesWithCache({
          chainId,
          rpcBaseURL,
          accountAddress,
          assetSlug,
          olderThan,
          signal
        });

        setActivities(currActivities.concat(newActivities));
        if (newActivities.length === 0) setReachedTheEnd(true);
      } catch (error) {
        if (signal.aborted) return;

        console.error(error);

        setError(error);

        setTimeout(() => {
          if (!signal.aborted) setError(null);
        }, RETRY_AFTER_ERROR_TIMEOUT);
      }

      setIsLoading(false);
    },
    [chainId, accountAddress, assetSlug],
    undefined,
    isKnownChainId(chainId)
  );

  const displayActivities = useMemo(
    () => (filterKind ? activities.filter(act => getActivityFilterKind(act) === filterKind) : activities),
    [activities, filterKind]
  );

  const feed = useInterleavedFeed({
    activities: displayActivities,
    remoteReachedTheEnd: reachedTheEnd,
    filterChain: { kind: TempleChainKind.Tezos, chainId: tezosChainId },
    accountId: currentAccount.id,
    enabled: Boolean(onCrossChainExchangeClick)
  });

  const groupedFeed = useGroupingByDate(feed);

  const tezosAssetsCheckConfig = useMemo(
    () => ({
      activities: displayActivities,
      tezAccountPkh: accountAddress,
      mainAsset: assetSlug ? { chainKind: TempleChainKind.Tezos, chainId, slug: assetSlug } : undefined
    }),
    [accountAddress, assetSlug, chainId, displayActivities]
  );
  useAssetsFromActivitiesCheck(tezosAssetsCheckConfig);

  const contentJsx = useMemo(
    () =>
      groupedFeed.map(([dateStr, items]) => (
        <ActivitiesDateGroup key={dateStr} title={dateStr}>
          {items.map(item => {
            if (item.kind === 'tezos') {
              return (
                <TezosActivityComponent
                  key={item.data.hash}
                  activity={item.data}
                  chain={network}
                  assetSlug={assetSlug}
                />
              );
            }
            if (item.kind === 'cross-chain') {
              return (
                <CrossChainActivityRow
                  key={item.data.id}
                  exchange={item.data}
                  onClick={() => onCrossChainExchangeClick?.(item.data.id)}
                />
              );
            }
            return null;
          })}
        </ActivitiesDateGroup>
      )),
    [groupedFeed, network, assetSlug, onCrossChainExchangeClick]
  );

  return (
    <ActivityListView
      activitiesNumber={feed.length}
      isSyncing={isLoading}
      reachedTheEnd={reachedTheEnd || Boolean(error)}
      loadNext={loadNext}
    >
      {contentJsx}
    </ActivityListView>
  );
});
