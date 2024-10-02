import React, { memo, useEffect, useMemo, useState } from 'react';

import { AxiosError } from 'axios';

import { EmptyState } from 'app/atoms/EmptyState';
import { InfiniteScroll } from 'app/atoms/InfiniteScroll';
import { useLoadPartnersPromo } from 'app/hooks/use-load-partners-promo';
import { Activity, EvmActivity } from 'lib/activity';
import { getEvmAssetTransactions } from 'lib/activity/evm';
import { preparseTezosOperationsGroup } from 'lib/activity/tezos';
import fetchTezosOperationsGroups from 'lib/activity/tezos/fetch';
import { TezosPreActivity } from 'lib/activity/tezos/types';
import { TzktApiChainId } from 'lib/apis/tzkt';
import { isKnownChainId as isKnownTzktChainId } from 'lib/apis/tzkt/api';
import { EvmAssetMetadataGetter, useGetEvmAssetMetadata } from 'lib/metadata';
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
import { useActivitiesLoadingLogic } from './loading-logic';

export const MultichainActivityList = memo(() => {
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

  const getEvmMetadata = useGetEvmAssetMetadata();

  const { activities, isLoading, reachedTheEnd, setActivities, setIsLoading, setReachedTheEnd, loadNext } =
    useActivitiesLoadingLogic<TezosPreActivity | EvmActivity>(
      async (initial, signal) => {
        if (signal.aborted) return;

        const currActivities = initial ? [] : activities;

        setIsLoading(currActivities.length ? 'more' : 'init');

        const allLoaders = [...tezosLoaders, ...evmLoaders];
        const lastEdgeDate = currActivities.at(-1)?.addedAt;

        await Promise.allSettled(
          evmLoaders
            .map(l => l.loadNext((slug: string) => getEvmMetadata(slug, l.chainId), lastEdgeDate, signal))
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

  const displayActivities = useMemo(
    () => activities.toSorted((a, b) => (a.addedAt < b.addedAt ? 1 : -1)),
    [activities]
  );

  if (displayActivities.length === 0 && !isLoading && reachedTheEnd) {
    return <EmptyState />;
  }

  return (
    <InfiniteScroll
      itemsLength={displayActivities.length}
      isSyncing={Boolean(isLoading)}
      reachedTheEnd={reachedTheEnd}
      retryInitialLoad={loadNext}
      loadMore={loadNext}
    >
      {displayActivities.map(activity =>
        isTezosActivity(activity) ? (
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

  async loadNext(
    getMetadata: EvmAssetMetadataGetter,
    edgeDate: string | undefined,
    signal: AbortSignal,
    assetSlug?: string
  ) {
    if (edgeDate) {
      const lastAct = this.activities.at(-1);
      if (lastAct && lastAct.addedAt > edgeDate) return;
    }

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
        nextPage,
        signal
      );

      if (signal.aborted) return;

      this.nextPage = newNextPage;

      if (newActivities.length) this.activities = this.activities.concat(newActivities);
      // else this.reachedTheEnd = true;

      // if (newNextPage == null) this.reachedTheEnd = true;

      // this.isLoading = false;

      delete this.lastError;
    } catch (error) {
      console.error(error);

      if (error instanceof AxiosError && error.status === 501) this.nextPage = null;
      else this.lastError = error;
    }
  }
}

class TezosActivityLoader {
  activities: TezosPreActivity[] = [];
  reachedTheEnd = false;
  lastError: unknown;

  constructor(readonly chainId: TzktApiChainId, readonly accountAddress: string, private rpcBaseURL: string) {
    //
  }

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

      const newActivities = groups.map(group => preparseTezosOperationsGroup(group, accountAddress, chainId));

      if (newActivities.length) this.activities = this.activities.concat(newActivities);
      else this.reachedTheEnd = true;

      delete this.lastError;
    } catch (error) {
      console.error(error);
      this.lastError = error;
    }
  }
}
