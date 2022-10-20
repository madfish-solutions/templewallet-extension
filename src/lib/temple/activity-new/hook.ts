import { useRef } from 'react';

import { useTezos, useChainId, useAccount } from 'lib/temple/front';
import { isKnownChainId } from 'lib/tzkt/api';
import { useDidMount, useDidUpdate, useSafeState } from 'lib/ui/hooks';

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

  const shouldStopRef = useRef<Symbol | null>(null);
  const buildShouldStop = () => {
    const symb = (shouldStopRef.current = Symbol());
    return () => symb !== shouldStopRef.current;
  };

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
    loadActivities(pseudoLimit, activities, buildShouldStop());
  }

  useDidMount(() => {
    loadActivities(initialPseudoLimit, [], buildShouldStop());
  });

  useDidUpdate(() => {
    setActivities([]);
    setLoading('init');
    setReachedTheEnd(false);

    loadActivities(initialPseudoLimit, [], buildShouldStop());
  }, [chainId, accountAddress, assetSlug]);

  return {
    loading,
    reachedTheEnd,
    list: activities,
    loadMore
  };
}
