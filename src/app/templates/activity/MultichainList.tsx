import React, { memo, useMemo } from 'react';

import { dispatch } from 'app/store';
import { putEvmNoCategoryAssetsMetadataAction } from 'app/store/evm/no-category-assets-metadata/actions';
import { Activity, EvmActivity, TezosActivity } from 'lib/activity';
import { isEtherlinkSupportedChainId } from 'lib/apis/etherlink';
import { TzktApiChainId } from 'lib/apis/tzkt';
import { isKnownChainId as isKnownTzktChainId } from 'lib/apis/tzkt/api';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { isTruthy } from 'lib/utils';
import {
  useAccountAddressForEvm,
  useAccountAddressForTezos,
  useAllEvmChains,
  useAllTezosChains,
  useEnabledEvmChains,
  useEnabledTezosChains
} from 'temple/front';

import { EvmActivityComponent, TezosActivityComponent } from './ActivityItem';
import { ActivityListView } from './ActivityListView';
import {
  fetchEtherlinkActivitiesWithCache,
  fetchEvmActivitiesWithCache,
  fetchTezosActivitiesWithCache
} from './fetch-activities-with-cache';
import { ActivitiesDateGroup, useGroupingByDate } from './grouping-by-date';
import { useActivitiesLoadingLogic } from './loading-logic';
import { useAssetsFromActivitiesCheck } from './use-assets-from-activites-check';
import { FilterKind, getActivityFilterKind, getAllEtherlinkActivitiesPageParams, isTezosActivity } from './utils';

interface Props {
  filterKind?: FilterKind;
}

const compareByChainId = <T extends { chainId: string | number }>(prev: T[], next: T[]): boolean => {
  if (!Array.isArray(prev) || !Array.isArray(next)) return false;
  if (prev.length !== next.length) return false;

  return prev.every((l, i) => l.chainId === next[i]?.chainId);
};

export const MultichainActivityList = memo<Props>(({ filterKind }) => {
  const tezosChains = useEnabledTezosChains();
  const evmChains = useEnabledEvmChains();

  const allTezosChains = useAllTezosChains();
  const allEvmChains = useAllEvmChains();

  const tezAccAddress = useAccountAddressForTezos();
  const evmAccAddress = useAccountAddressForEvm();

  const tezosLoaders = useMemoWithCompare(
    () =>
      tezAccAddress
        ? tezosChains
            .map(chain =>
              isKnownTzktChainId(chain.chainId)
                ? new TezosActivityLoader(chain.chainId, tezAccAddress, chain.rpcBaseURL)
                : null
            )
            .filter(isTruthy)
        : [],
    [tezosChains, tezAccAddress],
    compareByChainId
  );

  const evmLoaders = useMemoWithCompare(
    () => (evmAccAddress ? evmChains.map(chain => new EvmActivityLoader(chain.chainId, evmAccAddress)) : []),
    [evmChains, evmAccAddress],
    compareByChainId
  );

  const { activities, isLoading, reachedTheEnd, setActivities, setIsLoading, setReachedTheEnd, loadNext } =
    useActivitiesLoadingLogic<Activity>(
      async (initial, signal) => {
        if (signal.aborted) return;

        setIsLoading(true);

        const currActivities = initial ? [] : activities;

        const allLoaders = [...tezosLoaders, ...evmLoaders];
        const lastEdgeDate = currActivities.at(-1)?.addedAt;

        await Promise.allSettled(
          evmLoaders
            .map(l => l.loadNext(lastEdgeDate, signal))
            .concat(tezosLoaders.map(l => l.loadNext(lastEdgeDate, signal)))
        );

        if (signal.aborted) return;

        let edgeDate: string | undefined;

        for (const l of allLoaders) {
          if (l.reachedTheEnd || l.lastError) continue;

          const lastAct = l.activities.at(-1);
          if (!lastAct) continue;

          if (!edgeDate) {
            edgeDate = lastAct.addedAt;
            continue;
          }

          if (lastAct.addedAt > edgeDate) edgeDate = lastAct.addedAt;
        }

        const newActivities = allLoaders
          .map(l => {
            if (!edgeDate) return l.activities;

            // Not optimal, since activities are sorted already:
            // return l.activities.filter(a => a.addedAt >= edgeDate);

            const lastIndex = l.activities.findLastIndex(a => a.addedAt >= edgeDate);

            return lastIndex === -1 ? [] : l.activities.slice(0, lastIndex + 1);
          })
          .flat();

        if (currActivities.length === newActivities.length) setReachedTheEnd(true);
        else setActivities(newActivities);

        setIsLoading(false);
      },
      [tezosLoaders, evmLoaders]
    );

  const displayActivities = useMemo(() => {
    const filtered = filterKind ? activities.filter(act => getActivityFilterKind(act) === filterKind) : activities;

    return filtered.toSorted((a, b) => (a.addedAt < b.addedAt ? 1 : -1));
  }, [activities, filterKind]);

  const groupedActivities = useGroupingByDate(displayActivities);

  const contentJsx = useMemo(
    () =>
      groupedActivities.map(([dateStr, activities]) => (
        <ActivitiesDateGroup key={dateStr} title={dateStr}>
          {activities.map(activity =>
            isTezosActivity(activity) ? (
              <TezosActivityComponent
                key={activity.hash}
                activity={activity}
                chain={allTezosChains[activity.chainId]!}
              />
            ) : (
              <EvmActivityComponent key={activity.hash} activity={activity} chain={allEvmChains[activity.chainId]!} />
            )
          )}
        </ActivitiesDateGroup>
      )),
    [groupedActivities, allTezosChains, allEvmChains]
  );

  const tezosAssetsCheckConfig = useMemo(
    () => ({
      activities: displayActivities,
      tezAccountPkh: tezAccAddress,
      evmAccountPkh: evmAccAddress
    }),
    [displayActivities, tezAccAddress, evmAccAddress]
  );
  useAssetsFromActivitiesCheck(tezosAssetsCheckConfig);

  return (
    <ActivityListView
      activitiesNumber={displayActivities.length}
      isSyncing={isLoading}
      reachedTheEnd={reachedTheEnd}
      loadNext={loadNext}
    >
      {contentJsx}
    </ActivityListView>
  );
});

class EvmActivityLoader {
  activities: EvmActivity[] = [];
  reachedTheEnd = false;
  lastError: unknown;

  constructor(readonly chainId: number, readonly accountAddress: HexString) {}

  async loadNext(edgeDate: string | undefined, signal: AbortSignal) {
    if (edgeDate) {
      const lastAct = this.activities.at(-1);
      if (lastAct && lastAct.addedAt > edgeDate) return;
    }

    try {
      const { accountAddress, chainId } = this;

      if (this.reachedTheEnd || this.lastError) return;

      const lastActivity = this.activities.at(-1);

      if (isEtherlinkSupportedChainId(chainId)) {
        const {
          activities: newActivities,
          assetsMetadata,
          reachedTheEnd
        } = await fetchEtherlinkActivitiesWithCache({
          chainId,
          accountAddress,
          signal,
          olderThan: getAllEtherlinkActivitiesPageParams(this.activities)
        });
        if (Object.keys(assetsMetadata).length) {
          dispatch(
            putEvmNoCategoryAssetsMetadataAction({
              records: {
                [chainId]: assetsMetadata
              },
              associatedAccountPkh: accountAddress
            })
          );
        }

        if (newActivities.length) this.activities = this.activities.concat(newActivities);
        if (!newActivities.length || reachedTheEnd) this.reachedTheEnd = true;
      } else {
        const { activities: newActivities } = await fetchEvmActivitiesWithCache({
          chainId,
          accountAddress,
          signal,
          olderThan: lastActivity?.blockHeight
        });

        if (newActivities.length) this.activities = this.activities.concat(newActivities);
        else this.reachedTheEnd = true;
      }

      delete this.lastError;
    } catch (error) {
      if (signal.aborted) return;

      console.error(error);

      this.lastError = error;
    }
  }
}

class TezosActivityLoader {
  activities: TezosActivity[] = [];
  reachedTheEnd = false;
  lastError: unknown;

  constructor(readonly chainId: TzktApiChainId, readonly accountAddress: string, private rpcBaseURL: string) {}

  async loadNext(edgeDate: string | undefined, signal: AbortSignal, assetSlug?: string) {
    if (edgeDate) {
      const lastAct = this.activities.at(-1);
      if (lastAct && lastAct.addedAt > edgeDate) return;
    }

    try {
      const { accountAddress, chainId, rpcBaseURL } = this;

      const lastActivity = this.activities.at(-1);

      const { activities: newActivities } = await fetchTezosActivitiesWithCache({
        chainId,
        rpcBaseURL,
        accountAddress,
        assetSlug,
        olderThan: lastActivity,
        signal
      });

      if (newActivities.length) this.activities = this.activities.concat(newActivities);
      else this.reachedTheEnd = true;

      delete this.lastError;
    } catch (error) {
      if (signal.aborted) return;

      console.error(error);

      this.lastError = error;
    }
  }
}
