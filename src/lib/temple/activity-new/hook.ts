import { useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';
import { isSameDay } from 'date-fns';

import { isKnownChainId } from 'lib/apis/tzkt/api';
import { PAYOUTS_ALIASES, useTezos, useChainId, useAccount, useKnownBakers } from 'lib/temple/front';
import { useDidMount, useDidUpdate, useSafeState, useStopper } from 'lib/ui/hooks';

import fetchActivities from './fetch';
import { DisplayableActivity } from './types';

type TLoading = 'init' | 'more' | false;

export default function useActivities(initialPseudoLimit: number, assetSlug?: string) {
  const tezos = useTezos();
  const chainId = useChainId(true);
  const account = useAccount();
  const knownBakers = useKnownBakers();

  const accountAddress = account.publicKeyHash;

  const [loading, setLoading] = useSafeState<TLoading>(isKnownChainId(chainId) && 'init');
  const [activities, setActivities] = useSafeState<DisplayableActivity[]>([]);
  const [reachedTheEnd, setReachedTheEnd] = useSafeState(false);

  const { stop: stopLoading, stopAndBuildChecker } = useStopper();

  const tzktBakersAliases = useMemo(
    () => (knownBakers ?? []).map(({ address, name }) => ({ address, alias: name })).concat(PAYOUTS_ALIASES),
    [knownBakers]
  );

  async function loadActivities(pseudoLimit: number, activities: DisplayableActivity[], shouldStop: () => boolean) {
    if (!isKnownChainId(chainId)) {
      setLoading(false);
      setReachedTheEnd(true);
      return;
    }

    setLoading(activities.length ? 'more' : 'init');
    const lastActivity = activities[activities.length - 1];

    let newActivities: DisplayableActivity[];
    try {
      newActivities = await fetchActivities(
        chainId,
        account,
        assetSlug,
        pseudoLimit,
        tezos,
        tzktBakersAliases,
        lastActivity
      );
      if (shouldStop()) return;
    } catch (error) {
      if (shouldStop()) return;
      setLoading(false);
      console.error(error);

      return;
    }

    setActivities(activities.concat(newActivities));
    setLoading(false);
    if (newActivities.length === 0) {
      setReachedTheEnd(true);
    }
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
