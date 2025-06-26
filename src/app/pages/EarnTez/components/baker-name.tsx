import React, { PropsWithChildren } from 'react';

import { Name } from 'app/atoms';

import { EarnTezSelectors } from '../selectors';

export const BakerName: React.FC<PropsWithChildren> = ({ children }) => (
  <Name className="text-font-medium-bold" testID={EarnTezSelectors.delegatedBakerName}>
    {children}
  </Name>
);
