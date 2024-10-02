import React, { memo } from 'react';

import { EmptyState } from 'app/atoms/EmptyState';
import { InfiniteScroll } from 'app/atoms/InfiniteScroll';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { useLoadPartnersPromo } from 'app/hooks/use-load-partners-promo';
import { preparseTezosOperationsGroup } from 'lib/activity/tezos';
import fetchTezosOperationsGroups from 'lib/activity/tezos/fetch';
import { TezosPreActivity } from 'lib/activity/tezos/types';
import { isKnownChainId } from 'lib/apis/tzkt/api';
import { useAccountAddressForTezos, useTezosChainByChainId } from 'temple/front';

import { TezosActivityComponent } from './ActivityItem';
import { useActivitiesLoadingLogic } from './loading-logic';

interface Props {
  tezosChainId: string;
  assetSlug?: string;
}

export const TezosActivityList = memo<Props>(({ tezosChainId, assetSlug }) => {
  const network = useTezosChainByChainId(tezosChainId);
  const accountAddress = useAccountAddressForTezos();

  if (!network || !accountAddress) throw new DeadEndBoundaryError();

  useLoadPartnersPromo();

  const { chainId, rpcBaseURL } = network;

  const { activities, isLoading, reachedTheEnd, setActivities, setIsLoading, setReachedTheEnd, loadNext } =
    useActivitiesLoadingLogic<TezosPreActivity>(
      async (initial, signal) => {
        if (!isKnownChainId(chainId)) {
          setIsLoading(false);
          setReachedTheEnd(true);
          return;
        }

        const currActivities = initial ? [] : activities;

        setIsLoading(currActivities.length ? 'more' : 'init');

        const olderThan = currActivities.at(-1);

        try {
          const groups = await fetchTezosOperationsGroups(chainId, rpcBaseURL, accountAddress, assetSlug, olderThan);

          if (signal.aborted) return;

          const newActivities = groups.map(group => preparseTezosOperationsGroup(group, accountAddress, chainId));

          setActivities(currActivities.concat(newActivities));
          if (newActivities.length === 0) setReachedTheEnd(true);
        } catch (error) {
          if (signal.aborted) return;

          console.error(error);
        }

        setIsLoading(false);
      },
      [chainId, accountAddress, assetSlug],
      undefined,
      isKnownChainId(chainId)
    );

  if (activities.length === 0 && !isLoading && reachedTheEnd) {
    return <EmptyState />;
  }

  return (
    <InfiniteScroll
      itemsLength={activities.length}
      isSyncing={Boolean(isLoading)}
      reachedTheEnd={reachedTheEnd}
      retryInitialLoad={loadNext}
      loadMore={loadNext}
    >
      {activities.map(activity => (
        <TezosActivityComponent
          key={activity.hash}
          activity={activity}
          chain={network}
          accountAddress={accountAddress}
          assetSlug={assetSlug}
        />
      ))}
    </InfiniteScroll>
  );
});
