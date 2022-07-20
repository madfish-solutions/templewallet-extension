import React, { FC, ReactNode, useCallback } from 'react';

import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { useAB } from 'lib/temple/front';
import { ABTestGroup } from 'lib/templewallet-api';

interface ABContainerProps {
  groupAComponent: ReactNode;
  groupBComponent: ReactNode;
}

const ABContainer: FC<ABContainerProps> = ({ groupAComponent, groupBComponent }) => {
  const abGroup = useAB();
  const { trackABEvent } = useAnalytics();

  const handleAnalyticsClick = useCallback(() => {
    trackABEvent(`a/b ${abGroup} click`, AnalyticsEventCategory.ButtonPress);
  }, [abGroup, trackABEvent]);

  return (
    <div onClick={handleAnalyticsClick}>{abGroup === ABTestGroup.B ? { groupBComponent } : { groupAComponent }}</div>
  );
};

export default ABContainer;
