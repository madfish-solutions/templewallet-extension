import { useEffect, useMemo } from 'react';

import constate from 'constate';

import { useAnalyticsEnabledSelector } from 'app/store/settings/selectors';
import { ABTestGroup, getABGroup } from 'lib/apis/temple';

import { usePassiveStorage } from './storage';

export function useAB() {
  const abGroup = useABGroup();
  const analyticsEnabled = useAnalyticsEnabledSelector();

  return useMemo(() => {
    if (analyticsEnabled) {
      return abGroup;
    }
    return ABTestGroup.Unknown;
  }, [analyticsEnabled, abGroup]);
}

const [ABTestGroupProvider, useABGroup] = constate(() => {
  const [localABGroup, setLocalABGroup] = usePassiveStorage<ABTestGroup>('ab-test-value', ABTestGroup.Unknown);
  const analyticsEnabled = useAnalyticsEnabledSelector();

  useEffect(() => {
    if (analyticsEnabled && localABGroup === ABTestGroup.Unknown) {
      getABGroup().then(group => setLocalABGroup(group));
    }
  }, [setLocalABGroup, localABGroup, analyticsEnabled]);

  return localABGroup;
});

export { ABTestGroupProvider };
