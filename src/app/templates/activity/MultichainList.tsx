import React, { memo, useMemo } from 'react';

import { AxiosError } from 'axios';

import { EmptyState } from 'app/atoms/EmptyState';
import { InfiniteScroll } from 'app/atoms/InfiniteScroll';
import { useLoadPartnersPromo } from 'app/hooks/use-load-partners-promo';
import { Activity, EvmActivity, TezosActivity } from 'lib/activity';
import { getEvmAssetTransactions } from 'lib/activity/evm';
import { parseTezosOperationsGroup } from 'lib/activity/tezos';
import fetchTezosOperationsGroups from 'lib/activity/tezos/fetch';
import { TzktApiChainId } from 'lib/apis/tzkt';
import { isKnownChainId as isKnownTzktChainId } from 'lib/apis/tzkt/api';
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
import { ActivitiesDateGroup, useGroupingByDate } from './grouping-by-date';
import { useActivitiesLoadingLogic } from './loading-logic';
import { FilterKind, getActivityFilterKind } from './utils';

interface Props {
  filterKind: FilterKind;
}

export const MultichainActivityList = memo<Props>(({ filterKind }) => {
  useLoadPartnersPromo();

  const tezosChains = useEnabledTezosChains();
  const evmChains = useEnabledEvmChains();

  const allTezosChains = useAllTezosChains();
  const allEvmChains = useAllEvmChains();

  const tezAccAddress = useAccountAddressForTezos();
  const evmAccAddress = useAccountAddressForEvm();

  const tezosLoaders = useMemo(
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
    [tezosChains, tezAccAddress]
  );

  const evmLoaders = useMemo(
    () => (evmAccAddress ? evmChains.map(chain => new EvmActivityLoader(chain.chainId, evmAccAddress)) : []),
    [evmChains, evmAccAddress]
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

  if (displayActivities.length === 0 && !isLoading && reachedTheEnd) {
    return <EmptyState stretch />;
  }

  return (
    <InfiniteScroll
      itemsLength={displayActivities.length}
      isSyncing={isLoading}
      reachedTheEnd={reachedTheEnd}
      retryInitialLoad={loadNext}
      loadMore={loadNext}
    >
      {contentJsx}
    </InfiniteScroll>
  );
});

function isTezosActivity(activity: Activity): activity is TezosActivity {
  return 'oldestTzktOperation' in activity;
}

class EvmActivityLoader {
  activities: EvmActivity[] = [];
  lastError: unknown;
  private nextPage: number | nullish;

  constructor(readonly chainId: number, readonly accountAddress: string) {}

  get reachedTheEnd() {
    return this.nextPage === null;
  }

  async loadNext(edgeDate: string | undefined, signal: AbortSignal, assetSlug?: string) {
    if (edgeDate) {
      const lastAct = this.activities.at(-1);
      if (lastAct && lastAct.addedAt > edgeDate) return;
    }

    try {
      const { accountAddress, chainId, nextPage } = this;

      if (nextPage === null) return;

      const { nextPage: newNextPage, activities: newActivities } = await getEvmAssetTransactions(
        accountAddress,
        chainId,
        assetSlug,
        nextPage,
        signal
      );

      if (signal.aborted) return;

      this.nextPage = newNextPage;

      if (newActivities.length) this.activities = this.activities.concat(newActivities);

      delete this.lastError;
    } catch (error) {
      if (signal.aborted) return;

      console.error(error);

      if (error instanceof AxiosError && error.status === 501) this.nextPage = null;
      else this.lastError = error;
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

      const groups = await fetchTezosOperationsGroups(chainId, rpcBaseURL, accountAddress, assetSlug, lastActivity);

      if (signal.aborted) return;

      const newActivities = groups.map(group => parseTezosOperationsGroup(group, chainId, accountAddress));

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
