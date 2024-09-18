import { isKnownChainId } from 'lib/apis/tzkt/api';
import { useDidMount, useDidUpdate, useSafeState, useStopper } from 'lib/ui/hooks';
import { TezosNetworkEssentials } from 'temple/networks';

import fetchTezosOperationsGroups from './fetch';
import type { TezosPreActivity } from './types';
import { preparseTezosOperationsGroup } from './utils';

type TLoading = 'init' | 'more' | false;

export default function useTezosActivities(
  network: TezosNetworkEssentials,
  accountAddress: string,
  initialPseudoLimit: number,
  assetSlug?: string
) {
  const { chainId, rpcBaseURL } = network;

  const [loading, setLoading] = useSafeState<TLoading>(isKnownChainId(chainId) && 'init');
  const [activities, setActivities] = useSafeState<TezosPreActivity[]>([]);
  const [reachedTheEnd, setReachedTheEnd] = useSafeState(false);

  const { stop: stopLoading, stopAndBuildChecker } = useStopper();

  async function loadActivities(pseudoLimit: number, activities: TezosPreActivity[], shouldStop: () => boolean) {
    if (!isKnownChainId(chainId)) {
      setLoading(false);
      setReachedTheEnd(true);
      return;
    }

    setLoading(activities.length ? 'more' : 'init');
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
      setLoading(false);
      console.error(error);

      return;
    }

    setActivities(activities.concat(newActivities));
    setLoading(false);
    if (newActivities.length === 0) setReachedTheEnd(true);
  }

  /** Loads more of older items */
  function loadMore(pseudoLimit: number) {
    if (loading || reachedTheEnd) return;
    loadActivities(pseudoLimit, activities, stopAndBuildChecker());
  }

  useDidMount(() => {
    loadActivities(initialPseudoLimit, [], stopAndBuildChecker());

    return stopLoading;
  });

  useDidUpdate(() => {
    setActivities([]);
    setLoading('init');
    setReachedTheEnd(false);

    loadActivities(initialPseudoLimit, [], stopAndBuildChecker());
  }, [chainId, accountAddress, assetSlug]);

  return {
    loading,
    reachedTheEnd,
    list: activities,
    loadMore
  };
}
