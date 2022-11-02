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

const [ABTestGroupProvider, useABGroup] = constate(() => {
  const [localABGroup, setLocalABGroup] = usePassiveStorage<ABTestGroup>('ab-test-value', ABTestGroup.Unknown);
  const { analyticsState } = useAnalyticsState();

  useEffect(() => {
    if (analyticsState.enabled && localABGroup === ABTestGroup.Unknown) {
      getABGroup().then(group => setLocalABGroup(group));
    }
  }, [setLocalABGroup, localABGroup, analyticsState.enabled]);

  return localABGroup;
});

export { ABTestGroupProvider };
