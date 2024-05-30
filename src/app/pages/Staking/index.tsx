import React, { memo } from 'react';

import { TabsPageLayout } from 'app/layouts/TabsPageLayout';

import { MyStakeTab } from './MyStake';
import { NewStakeTab } from './NewStake';
import { StakingPageSelectors } from './selectors';

export const StakingPage = memo(() => (
  <TabsPageLayout
    title="Tezos Staking"
    tabs={[
      {
        slug: 'new-stake',
        title: 'New stake',
        Component: NewStakeTab,
        testID: StakingPageSelectors.newStakeTab
      },
      {
        slug: 'my-stake',
        title: 'My stake',
        Component: MyStakeTab,
        testID: StakingPageSelectors.myStakeTab
      }
    ]}
  />
));
