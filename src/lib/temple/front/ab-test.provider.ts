import { useEffect, useMemo } from 'react';

import constate from 'constate';

import { useAnalyticsState } from 'lib/analytics/use-analytics-state.hook';
import { ABTestGroup, getABGroup } from 'lib/templewallet-api';

import { usePassiveStorage } from './storage';

export function useAB() {
  const abGroup = useABGroup();
  const { analyticsState } = useAnalyticsState();

  return useMemo(() => {
    if (analyticsState.enabled) {
      return abGroup;
    }
    return ABTestGroup.Unknown;
  }, [analyticsState, abGroup]);
}

export const [ABTestGroupProvider, useABGroup] = constate((params: { suspense?: boolean }) => {
  const [localABGroup, setLocalABGroup] = usePassiveStorage<ABTestGroup>('ab-test-value', ABTestGroup.Unknown);

  useEffect(() => {
    const getData = async () => {
      const data = await fetchABGroup();
      if (localABGroup === ABTestGroup.Unknown) setLocalABGroup(data?.ab ?? ABTestGroup.A);
    };
    getData();
  }, [setLocalABGroup, localABGroup]);

  return localABGroup;
});

async function fetchABGroup() {
  const group = await getABGroup({}).catch(() => null);
  return group;
}
