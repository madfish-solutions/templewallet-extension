import React, { FC, ReactNode } from 'react';

import { ABTestGroup } from 'lib/apis/temple';

import { useUserTestingGroupNameSelector } from '../store/ab-testing/selectors';

interface ABContainerProps {
  groupAComponent: ReactNode;
  groupBComponent: ReactNode;
}

const ABContainer: FC<ABContainerProps> = ({ groupAComponent, groupBComponent }) => {
  const abGroup = useUserTestingGroupNameSelector();

  return abGroup === ABTestGroup.B ? <>{groupBComponent}</> : <>{groupAComponent}</>;
};

export default ABContainer;
