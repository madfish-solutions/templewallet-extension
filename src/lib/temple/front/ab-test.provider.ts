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
      if (localABGroup === ABTestGroup.Unknown) {
        const data = await fetchABGroup();
        setLocalABGroup(data?.ab ?? ABTestGroup.Unknown);
      }
    };
    getData();
  }, [setLocalABGroup, localABGroup]);

  return localABGroup;
});

async function fetchABGroup() {
  const group = await getABGroup({}).catch(() => null);
  return group;
}
