import React, { memo, useMemo } from 'react';

import { useManagableTezosStakeInfo } from 'app/hooks/use-baking-hooks';
import { TabInterface, TabsPageLayout } from 'app/layouts/TabsPageLayout';
import { useAccountPkh, useNetwork } from 'lib/temple/front';

import { MyStakeTab } from './MyStake';
import { NewStakeTab } from './NewStake';
import { StakingPageSelectors } from './selectors';

export const StakingPage = memo(() => {
  const accountPkh = useAccountPkh();
  const { rpcBaseURL } = useNetwork();

  const { mayManage, requestsN } = useManagableTezosStakeInfo(rpcBaseURL, accountPkh);

  const tabs = useMemo<TabInterface[]>(
    () => [
      {
        slug: 'new-stake',
        title: 'New stake',
        Component: NewStakeTab,
        testID: StakingPageSelectors.newStakeTab
      },
      {
        slug: 'my-stake',
        disabled: !mayManage,
        title: (
          <div className="flex items-center justify-center gap-x-2">
            <span>My stake</span>

            {requestsN > 0 && (
              <div className="w-4 h-4 text-center font-medium bg-current rounded-full">
                <div className="leading-4 text-white" style={{ fontSize: 8 }}>
                  {requestsN}
                </div>
              </div>
            )}
          </div>
        ),
        Component: MyStakeTab,
        testID: StakingPageSelectors.myStakeTab
      }
    ],
    [mayManage, requestsN]
  );

  return <TabsPageLayout title="Tezos Staking" tabs={tabs} />;
});
