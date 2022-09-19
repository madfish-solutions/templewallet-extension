import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';

import { useSafeState } from 'ahooks';
import { useDidMount, useDidUpdate } from 'rooks';

import { useTezos, useChainId, useAccount } from 'lib/temple/front';
import { isKnownChainId } from 'lib/tzkt/api';

import fetchActivities from './fetch';
import type { Activity } from './utils';

////

type TLoading = 'init' | 'more' | false;

export default function useActivities(initialPseudoLimit: number, assetSlug?: string) {
  const tezos = useTezos();
  const chainId = useChainId(true);
  const account = useAccount();

  const accountAddress = account.publicKeyHash;

  const [loading, setLoading] = useSafeState<TLoading>(isKnownChainId(chainId) && 'init');
  const [activities, setActivities] = useSafeState<Activity[]>([]);
  const [reachedTheEnd, setReachedTheEnd] = useSafeState(false);

  async function loadActivities(pseudoLimit: number, activities: Activity[]) {
    if (!isKnownChainId(chainId)) {
      setLoading(false);
      return;
    }

    setLoading(activities.length ? 'more' : 'init');
    const lastActivity = activities[activities.length - 1];

    let newActivities: Activity[];
    try {
      newActivities = await fetchActivities(chainId, account, assetSlug, pseudoLimit, tezos, lastActivity);
    } catch (error) {
      setLoading(false);
      console.log(error);

      return;
    }

    setActivities(activities.concat(newActivities));
    setLoading(false);
    // if(newActivities.length < limit)
    if (newActivities.length === 0) setReachedTheEnd(true);
  }

  /** Loads more of older items */
  function loadMore(pseudoLimit: number) {
    if (loading || reachedTheEnd) return;
    loadActivities(pseudoLimit, activities);
  }

  useDidMount(() => {
    loadActivities(initialPseudoLimit, activities);
  });

  useDidUpdate(() => {
    setActivities([]);
    setLoading('init');
    setReachedTheEnd(false);

    loadActivities(initialPseudoLimit, []);
  }, [chainId, accountAddress, assetSlug]);

  return {
    loading,
    reachedTheEnd,
    list: activities,
    loadMore
  };
}
