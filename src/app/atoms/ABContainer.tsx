import React, { FC, ReactNode } from 'react';

import { useAB } from 'lib/temple/front';

interface ABContainerProps {
  noAnalyticsComponent: ReactNode;
  groupAComponent: ReactNode;
  groupBComponent: ReactNode;
}

const ABContainer: FC<ABContainerProps> = ({ noAnalyticsComponent, groupAComponent, groupBComponent }) => {
  const abGroup = useAB();
  if (abGroup === null) return <>{noAnalyticsComponent}</>;
  return abGroup === 'A' ? <>{groupAComponent}</> : <>{groupBComponent}</>;
};

export default ABContainer;
