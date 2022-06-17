import { useEffect, useMemo } from 'react';

import constate from 'constate';

import { useAnalyticsState } from 'lib/analytics/use-analytics-state.hook';
import { useRetryableSWR } from 'lib/swr';
import { getABGroup } from 'lib/templewallet-api';

import { usePassiveStorage } from './storage';

export function useAB() {
  const { data: abGroup, loading } = useABGroup();
  const { analyticsState } = useAnalyticsState();

  const [localABGroup, setLocalABGroup] = usePassiveStorage<'A' | 'B' | null>('ab-test-value', null);

  useEffect(() => {
    if (!loading && !localABGroup) {
      setLocalABGroup(abGroup);
    }
  }, [localABGroup, loading, setLocalABGroup, abGroup]);

  return useMemo(() => {
    if (analyticsState.enabled) {
      return localABGroup;
    }
    return null;
  }, [analyticsState, localABGroup]);
}

export const [ABTestGroupProvider, useABGroup] = constate((params: { suspense?: boolean }) => {
  const { data, isValidating: loading } = useRetryableSWR('ab-test-group', fetchABGroup, {
    revalidateOnMount: false,
    dedupingInterval: 30_000,
    suspense: params.suspense
  });
  return { data: data?.ab ?? null, loading };
});

async function fetchABGroup() {
  try {
    const group = await getABGroup({});
    return group;
  } catch {
    return null;
  }
}
