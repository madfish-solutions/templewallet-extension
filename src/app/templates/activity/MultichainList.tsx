import React, { memo, useEffect, useMemo, useState } from 'react';

import { EmptyState } from 'app/atoms/EmptyState';
import { InfiniteScroll } from 'app/atoms/InfiniteScroll';
import { useLoadPartnersPromo } from 'app/hooks/use-load-partners-promo';
import { Activity, EvmActivity } from 'lib/activity';
import { getEvmAssetTransactions } from 'lib/activity/evm';
import { TezosPreActivity } from 'lib/activity/tezos/types';
import { EvmAssetMetadataGetter, useGetEvmAssetMetadata } from 'lib/metadata';
import { useDidMount, useDidUpdate, useSafeState, useStopper } from 'lib/ui/hooks';
import {
  useAccountAddressForEvm,
  useAccountAddressForTezos,
  useAllEvmChains,
  useAllTezosChains,
  useEnabledEvmChains,
  useEnabledTezosChains
} from 'temple/front';

import { EvmActivityComponent, TezosActivityComponent } from './ActivityItem';

export const MultichainActivityList = memo(() => {
  useLoadPartnersPromo();

  const tezosChains = useEnabledTezosChains();
  const evmChains = useEnabledEvmChains();

  const allTezosChains = useAllTezosChains();
  const allEvmChains = useAllEvmChains();

  const tezAccAddress = useAccountAddressForTezos();
  const evmAccAddress = useAccountAddressForEvm();

  const evmLoaders = useMemo(
    () => (evmAccAddress ? evmChains.map(chain => new EvmActivityLoader(chain.chainId, evmAccAddress)) : []),
    [evmChains, evmAccAddress]
  );

  const [isLoading, setIsLoading] = useSafeState(true);
  const [reachedTheEnd, setReachedTheEnd] = useSafeState(false);
  const [activities, setActivities] = useState<(EvmActivity | TezosPreActivity)[]>([]);

  const { stop: stopLoading, stopAndBuildChecker } = useStopper();

  const getEvmMetadata = useGetEvmAssetMetadata();

  async function loadActivities(shouldStop: () => boolean) {
    if (shouldStop()) return;

    setIsLoading(true);

    await Promise.allSettled(evmLoaders.map(l => l.loadNext((slug: string) => getEvmMetadata(slug, l.chainId))));

    if (shouldStop()) return;

    let edgeDate: string | undefined;

    for (const l of evmLoaders) {
      if (l.reachedTheEnd || l.lastError) continue;

      const lastAct = l.activities.at(-1);
      if (!lastAct) continue;

      if (!edgeDate) {
        edgeDate = lastAct.createdAt;
        continue;
      }

      if (lastAct.createdAt > edgeDate) edgeDate = lastAct.createdAt;
    }

    const newActivities = evmLoaders
      .map(l => (edgeDate ? l.activities.filter(a => a.createdAt >= edgeDate) : l.activities)) // TODO: Optimize
      .flat()
      .toSorted((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    setActivities(newActivities);
    setIsLoading(false);

    if (activities.length === newActivities.length) setReachedTheEnd(true);
  }

  /** Loads more of older items */
  function loadMore() {
    if (isLoading || reachedTheEnd) return;
    loadActivities(stopAndBuildChecker());
  }

  useDidMount(() => {
    loadActivities(stopAndBuildChecker());

    return stopLoading;
  });

  useDidUpdate(() => {
    setActivities([]);
    setIsLoading(true);
    setReachedTheEnd(false);

    loadActivities(stopAndBuildChecker());
  }, [tezAccAddress, evmAccAddress]);

  // const displayActivities: (EvmActivity | TezosPreActivity)[] = [];

  if (activities.length === 0 && !isLoading && reachedTheEnd) {
    return <EmptyState />;
  }

  return (
    <InfiniteScroll
      itemsLength={activities.length}
      isSyncing={isLoading}
      reachedTheEnd={reachedTheEnd}
      retryInitialLoad={loadMore}
      loadMore={loadMore}
    >
      {activities.map(activity =>
        'oldestTzktOperation' in activity ? (
          <TezosActivityComponent
            key={activity.hash}
            activity={activity}
            chain={allTezosChains[activity.chainId]}
            accountAddress={tezAccAddress!}
          />
        ) : (
          <EvmActivityComponent key={activity.hash} activity={activity} chain={allEvmChains[activity.chainId]} />
        )
      )}
    </InfiniteScroll>
  );
});

function isTezosActivity(activity: EvmActivity | TezosPreActivity): activity is TezosPreActivity {
  return 'oldestTzktOperation' in activity;
}

// interface EvmChainActivity {
//   activity:
// }

class EvmActivityLoader {
  activities: EvmActivity[] = [];
  private nextPage: number | nullish;
  // private isLoading = false;
  // private reachedTheEnd = false;
  lastError: unknown;

  constructor(readonly chainId: number, readonly accountAddress: string) {
    //
  }

  get reachedTheEnd() {
    return this.nextPage === null;
  }

  async loadNext(getMetadata: EvmAssetMetadataGetter, assetSlug?: string) {
    try {
      // if (this.isLoading) return;
      // this.isLoading = true;

      const { accountAddress, chainId, nextPage } = this;

      if (nextPage === null) return;

      const { nextPage: newNextPage, activities: newActivities } = await getEvmAssetTransactions(
        accountAddress,
        chainId,
        getMetadata,
        assetSlug,
        nextPage
      );
      // TODO: Apply if shouldn't have stopped only

      this.nextPage = newNextPage;

      if (newActivities.length) this.activities = this.activities.concat(newActivities);
      // else this.reachedTheEnd = true;

      // if (newNextPage == null) this.reachedTheEnd = true;

      // this.isLoading = false;

      delete this.lastError;
    } catch (error) {
      console.error(error);
      this.lastError = error;
    }
  }
}
