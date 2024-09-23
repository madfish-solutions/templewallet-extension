import React, { memo } from 'react';

import { EmptyState } from 'app/atoms/EmptyState';
import { InfiniteScroll } from 'app/atoms/InfiniteScroll';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { useLoadPartnersPromo } from 'app/hooks/use-load-partners-promo';
import { preparseTezosOperationsGroup } from 'lib/activity/tezos';
import fetchTezosOperationsGroups from 'lib/activity/tezos/fetch';
import { TezosPreActivity } from 'lib/activity/tezos/types';
import { isKnownChainId } from 'lib/apis/tzkt/api';
import { useDidMount, useDidUpdate, useSafeState, useStopper } from 'lib/ui/hooks';
import { useAccountAddressForTezos, useTezosChainByChainId } from 'temple/front';
import { TezosNetworkEssentials } from 'temple/networks';

import { TezosActivityComponent } from './ActivityItem';

const INITIAL_NUMBER = 30;
const LOAD_STEP = 30;

interface TezosActivityTabProps {
  tezosChainId: string;
  assetSlug?: string;
}

export const TezosActivityTab = memo<TezosActivityTabProps>(({ tezosChainId, assetSlug }) => {
  const network = useTezosChainByChainId(tezosChainId);
  const accountAddress = useAccountAddressForTezos();

  if (!network || !accountAddress) throw new DeadEndBoundaryError();

  useLoadPartnersPromo();

  const {
    isLoading,
    reachedTheEnd,
    list: activities,
    loadMore
  } = useTezosActivities(network, accountAddress, INITIAL_NUMBER, assetSlug);

  if (activities.length === 0 && !isLoading && reachedTheEnd) {
    return <EmptyState />;
  }

  return (
    <InfiniteScroll
      itemsLength={activities.length}
      isSyncing={Boolean(isLoading)}
      reachedTheEnd={reachedTheEnd}
      retryInitialLoad={() => loadMore(INITIAL_NUMBER)}
      loadMore={() => loadMore(LOAD_STEP)}
    >
      {activities.map(activity => (
        <TezosActivityComponent
          key={activity.hash}
          activity={activity}
          chain={network}
          accountAddress={accountAddress}
        />
      ))}
    </InfiniteScroll>
  );
});

type TLoading = 'init' | 'more' | false;

function useTezosActivities(
  network: TezosNetworkEssentials,
  accountAddress: string,
  initialPseudoLimit: number,
  assetSlug?: string
) {
  const { chainId, rpcBaseURL } = network;

  const [isLoading, setIsLoading] = useSafeState<TLoading>(isKnownChainId(chainId) && 'init');
  const [activities, setActivities] = useSafeState<TezosPreActivity[]>([]);
  const [reachedTheEnd, setReachedTheEnd] = useSafeState(false);

  const { stop: stopLoading, stopAndBuildChecker } = useStopper();

  async function loadActivities(pseudoLimit: number, activities: TezosPreActivity[], shouldStop: () => boolean) {
    if (!isKnownChainId(chainId)) {
      setIsLoading(false);
      setReachedTheEnd(true);
      return;
    }

    setIsLoading(activities.length ? 'more' : 'init');
    const lastActivity = activities[activities.length - 1];

    let newActivities: TezosPreActivity[];
    try {
      const groups = await fetchTezosOperationsGroups(
        chainId,
        rpcBaseURL,
        accountAddress,
        assetSlug,
        pseudoLimit,
        lastActivity
      );

      newActivities = groups.map(group => preparseTezosOperationsGroup(group, accountAddress));

      if (shouldStop()) return;
    } catch (error) {
      if (shouldStop()) return;
      setIsLoading(false);
      console.error(error);

      return;
    }

    setActivities(activities.concat(newActivities));
    setIsLoading(false);
    if (newActivities.length === 0) setReachedTheEnd(true);
  }

  /** Loads more of older items */
  function loadMore(pseudoLimit: number) {
    if (isLoading || reachedTheEnd) return;
    loadActivities(pseudoLimit, activities, stopAndBuildChecker());
  }

  useDidMount(() => {
    loadActivities(initialPseudoLimit, [], stopAndBuildChecker());

    return stopLoading;
  });

  useDidUpdate(() => {
    setActivities([]);
    setIsLoading('init');
    setReachedTheEnd(false);

    loadActivities(initialPseudoLimit, [], stopAndBuildChecker());
  }, [chainId, accountAddress, assetSlug]);

  return {
    isLoading,
    reachedTheEnd,
    list: activities,
    loadMore
  };
}
