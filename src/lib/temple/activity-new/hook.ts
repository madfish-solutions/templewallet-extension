import { isKnownChainId } from 'lib/apis/tzkt/api';
import { useTezos, useChainId, useAccount } from 'lib/temple/front';
import { useDidMount, useDidUpdate, useSafeState, useStopper } from 'lib/ui/hooks';

import fetchActivities from './fetch';
import type { Activity } from './types';

type TLoading = 'init' | 'more' | false;

export default function useActivities(initialPseudoLimit: number, assetSlug?: string) {
  const tezos = useTezos();
  const chainId = useChainId(true);
  const account = useAccount();

  const accountAddress = account.publicKeyHash;

  const [loading, setLoading] = useSafeState<TLoading>(isKnownChainId(chainId) && 'init');
  const [activities, setActivities] = useSafeState<Activity[]>([]);
  const [reachedTheEnd, setReachedTheEnd] = useSafeState(false);

  const { stop: stopLoading, stopAndBuildChecker } = useStopper();

  async function loadActivities(pseudoLimit: number, activities: Activity[], shouldStop: () => boolean) {
    if (!isKnownChainId(chainId)) {
      setLoading(false);
      setReachedTheEnd(true);
      return;
    }

    setLoading(activities.length ? 'more' : 'init');
    const lastActivity = activities[activities.length - 1];

    let newActivities: Activity[];
    try {
      newActivities = await fetchActivities(chainId, account, assetSlug, pseudoLimit, tezos, lastActivity);
      if (shouldStop()) return;
    } catch (error) {
      if (shouldStop()) return;
      setLoading(false);
      console.log(error);

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
