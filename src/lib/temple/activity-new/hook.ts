import { useMemo, useRef } from 'react';

import { isDefined } from '@rnw-community/shared';
import { isSameDay } from 'date-fns';

import type { TzktOperation } from 'lib/apis/tzkt';
import { isKnownChainId } from 'lib/apis/tzkt/api';
import { useTezos, useChainId, useAccount, useKnownBakers } from 'lib/temple/front';
import { useDidMount, useDidUpdate, useSafeState, useStopper } from 'lib/ui/hooks';

import fetchActivities from './fetch';
import { DisplayableActivity } from './types';

type TLoading = 'init' | 'more' | false;

export default function useActivities(initialPseudoLimit: number, assetSlug?: string) {
  const tezos = useTezos();
  const chainId = useChainId(true);
  const account = useAccount();
  const knownBakers = useKnownBakers(false);
  const oldestOperationRef = useRef<TzktOperation>();

  const accountAddress = account.publicKeyHash;

  const [loading, setLoading] = useSafeState<TLoading>(isKnownChainId(chainId) && 'init');
  const [activities, setActivities] = useSafeState<DisplayableActivity[]>([]);
  const [reachedTheEnd, setReachedTheEnd] = useSafeState(false);

  const { stop: stopLoading, stopAndBuildChecker } = useStopper();

  const tzktBakersAliases = useMemo(
    () => knownBakers?.map(({ address, name }) => ({ address, alias: name })) ?? [],
    [knownBakers]
  );

  async function loadActivities(pseudoLimit: number, activities: DisplayableActivity[], shouldStop: () => boolean) {
    if (!isKnownChainId(chainId)) {
      setLoading(false);
      setReachedTheEnd(true);
      return;
    }

    setLoading(activities.length ? 'more' : 'init');

    const allNewActivities: DisplayableActivity[] = [];

    // Loading 10+ items first (initially) & 3+ for the following calls
    const minGroupsCount = activities.length ? 3 : 10;

    let newActivities: DisplayableActivity[];
    let newReachedTheEnd = false;
    let newOldestOperation: TzktOperation | undefined;

    while (allNewActivities.length < minGroupsCount) {
      if (newReachedTheEnd) break;

      try {
        ({
          activities: newActivities,
          reachedTheEnd: newReachedTheEnd,
          oldestOperation: newOldestOperation
        } = await fetchActivities(
          chainId,
          account,
          assetSlug,
          pseudoLimit,
          tezos,
          tzktBakersAliases,
          oldestOperationRef.current
        ));
        oldestOperationRef.current = newOldestOperation ?? oldestOperationRef.current;
        if (shouldStop()) return;
      } catch (error) {
        if (shouldStop()) return;
        setLoading(false);
        console.error(error);

        return;
      }

      allNewActivities.push(...newActivities);
    }

    setActivities(activities.concat(allNewActivities));
    setLoading(false);
    setReachedTheEnd(newReachedTheEnd);
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

  const groupedByDayActivities = useMemo(
    () =>
      activities.reduce<DisplayableActivity[][]>((acc, activity) => {
        const firstDayActivities = acc[acc.length - 1];
        const firstDayActivityTimestamp = firstDayActivities?.[0]?.timestamp;

        if (
          isDefined(firstDayActivityTimestamp) &&
          isSameDay(new Date(firstDayActivityTimestamp), new Date(activity.timestamp))
        ) {
          firstDayActivities.push(activity);
        } else {
          acc.push([activity]);
        }

        return acc;
      }, []),
    [activities]
  );

  return {
    loading,
    reachedTheEnd,
    groupedByDayActivities,
    loadMore
  };
}
