import { useMemo } from 'react';

import { useChainId, useAccount } from 'lib/temple/front';
import { isKnownChainId } from 'lib/tzkt/api';
import { useDidMount, useDidUpdate, useSafeState } from 'lib/ui/hooks';

import { Activity } from '../activity-new/types';
import { getLocalActivity, removeLocalOperation } from './local';

const EXPIRATION_DATE = 4 * 60 * 60 * 1000;

export function useLocalActivities() {
  const chainId = useChainId(true);
  const [activities, setActivities] = useSafeState<Activity[]>([]);
  const { publicKeyHash } = useAccount();

  async function loadActivities(chainId: string, publicKeyHash: string) {
    const pending = await getLocalActivity(chainId, publicKeyHash);
    setActivities(pending);
  }

  useDidMount(() => {
    if (isKnownChainId(chainId)) {
      loadActivities(chainId, publicKeyHash);
    }
  });

  useDidUpdate(() => {
    if (isKnownChainId(chainId)) {
      setActivities([]);
      loadActivities(chainId, publicKeyHash);
    }
  }, [chainId, publicKeyHash]);

  return activities;
}

export function useLocalActivitiesCleanedUp(localActivities: Activity[], remoteActivities: Activity[]) {
  return useMemo(() => {
    if (localActivities.length < 1) return [];
    if (remoteActivities.length < 1) return localActivities;

    const original: Activity[] = [];
    const collised: Activity[] = [];

    for (const activity of localActivities) {
      if (
        remoteActivities.some(a => a.hash === activity.hash) ||
        Date.now() - Number(activity.addedAt) > EXPIRATION_DATE
      ) {
        collised.push(activity);
      } else {
        original.push(activity);
      }
    }

    collised.forEach(({ hash }) => removeLocalOperation(hash));

    return original;
  }, [localActivities, remoteActivities]);
}
