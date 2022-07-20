import React, { FC, ReactNode } from 'react';

import { useAB } from 'lib/temple/front';
import { ABTestGroup } from 'lib/templewallet-api';

interface ABContainerProps {
  groupAComponent: ReactNode;
  groupBComponent: ReactNode;
}

const ABContainer: FC<ABContainerProps> = ({ groupAComponent, groupBComponent }) => {
  const abGroup = useAB();

  return abGroup === ABTestGroup.B ? <>{groupBComponent}</> : <>{groupAComponent}</>;
};

export default ABContainer;
