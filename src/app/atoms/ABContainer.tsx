import React, { FC, ReactNode, useEffect } from 'react';

import { useAnalytics } from 'lib/analytics';
import { useAB } from 'lib/temple/front';
import { ABTestGroup } from 'lib/templewallet-api';

interface ABContainerProps {
  groupAComponent: ReactNode;
  groupBComponent: ReactNode;
}

const ABContainer: FC<ABContainerProps> = ({ groupAComponent, groupBComponent }) => {
  const abGroup = useAB();
  const { pageEvent } = useAnalytics();

  useEffect(() => {
    if (abGroup !== ABTestGroup.Unknown) {
      pageEvent('ABTest', abGroup);
    }
  }, [abGroup, pageEvent]);

  return abGroup === ABTestGroup.B ? <>{groupBComponent}</> : <>{groupAComponent}</>;
};

export default ABContainer;
