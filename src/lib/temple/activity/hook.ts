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
  const account = useAccount();
  const accountAddress = account.publicKeyHash;

  async function loadActivities(chainId: string, accountAddress: string) {
    const pending = await getLocalActivity(chainId, accountAddress);
    setActivities(pending);
  }

  useDidMount(() => {
    if (isKnownChainId(chainId)) {
      loadActivities(chainId, accountAddress);
    }
  });

  useDidUpdate(() => {
    if (isKnownChainId(chainId)) {
      setActivities([]);
      loadActivities(chainId, accountAddress);
    }
  }, [chainId, accountAddress]);

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
