import React, { FC, ReactNode, useEffect } from 'react';

import { useAnalytics } from 'lib/analytics';
import { useAnalyticsState } from 'lib/analytics/use-analytics-state.hook';
import { useAB } from 'lib/temple/front';
import { ABTestGroup } from 'lib/templewallet-api';

interface ABContainerProps {
  groupAComponent: ReactNode;
  groupBComponent: ReactNode;
}

const ABContainer: FC<ABContainerProps> = ({ groupAComponent, groupBComponent }) => {
  const abGroup = useAB();
  const { analyticsState } = useAnalyticsState();
  const { pageEvent } = useAnalytics();

  useEffect(() => {
    if (analyticsState.enabled) {
      pageEvent('ABTest', abGroup);
    }
  }, [abGroup, analyticsState.enabled, pageEvent]);

  return abGroup === ABTestGroup.B ? <>{groupBComponent}</> : <>{groupAComponent}</>;
};

export default ABContainer;
