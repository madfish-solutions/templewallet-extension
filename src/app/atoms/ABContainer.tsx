import React, { FC, ReactNode } from 'react';

import { useAB } from 'lib/temple/front';
import { ABTestGroup } from 'lib/templewallet-api';

interface ABContainerProps {
  noAnalyticsComponent: ReactNode;
  groupAComponent: ReactNode;
  groupBComponent: ReactNode;
}

const ABContainer: FC<ABContainerProps> = ({ noAnalyticsComponent, groupAComponent, groupBComponent }) => {
  const abGroup = useAB();
  if (abGroup === ABTestGroup.Unknown) return <>{noAnalyticsComponent}</>;
  return abGroup === ABTestGroup.A ? <>{groupAComponent}</> : <>{groupBComponent}</>;
};

export default ABContainer;
