import { useEffect, useMemo } from 'react';

import constate from 'constate';

import { useAnalyticsState } from 'lib/analytics/use-analytics-state.hook';
import { useRetryableSWR } from 'lib/swr';
import { ABTestGroup, getABGroup } from 'lib/templewallet-api';

import { usePassiveStorage } from './storage';

export function useAB() {
  const { data: abGroup, loading } = useABGroup();
  const { analyticsState } = useAnalyticsState();

  const [localABGroup, setLocalABGroup] = usePassiveStorage<ABTestGroup>('ab-test-value', ABTestGroup.Unknown);

  useEffect(() => {
    if (!loading && !localABGroup) {
      setLocalABGroup(abGroup);
    }
  }, [localABGroup, loading, setLocalABGroup, abGroup]);

  return useMemo(() => {
    if (analyticsState.enabled) {
      return localABGroup;
    }
    return ABTestGroup.Unknown;
  }, [analyticsState, localABGroup]);
}

export const [ABTestGroupProvider, useABGroup] = constate((params: { suspense?: boolean }) => {
  const { data, isValidating: loading } = useRetryableSWR('ab-test-group', fetchABGroup, {
    revalidateOnMount: false,
    dedupingInterval: 30_000,
    suspense: params.suspense
  });
  return { data: data?.ab ?? ABTestGroup.Unknown, loading };
});

async function fetchABGroup() {
  const group = await getABGroup({}).catch(() => null);
  return group;
}
