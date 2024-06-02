import React, { memo, useMemo } from 'react';

import { TabInterface, TabsPageLayout } from 'app/layouts/TabsPageLayout';
import { useRetryableSWR } from 'lib/swr';
import { useAccountPkh, useTezos } from 'lib/temple/front';

import { MyStakeTab } from './MyStake';
import { NewStakeTab } from './NewStake';
import { StakingPageSelectors } from './selectors';

export const StakingPage = memo(() => {
  const accountPkh = useAccountPkh();
  const tezos = useTezos();

  const { data: stakedData } = useRetryableSWR(
    ['delegate-stake', 'get-staked', tezos.checksum],
    () => tezos.rpc.getStakedBalance(accountPkh),
    { revalidateOnFocus: false }
  );

  const { data: requests } = useRetryableSWR(
    ['delegate-stake', 'get-unstake-requests', tezos.checksum],
    () => tezos.rpc.getUnstakeRequests(accountPkh),
    { revalidateOnFocus: false }
  );

  const tabs = useMemo<TabInterface[]>(() => {
    const requestsN = requests ? requests.finalizable.length + requests.unfinalizable.requests.length : 0;

    const myStakeDisabled = !requestsN && (!stakedData || stakedData.isZero());

    return [
      {
        slug: 'new-stake',
        title: 'New stake',
        Component: NewStakeTab,
        testID: StakingPageSelectors.newStakeTab
      },
      {
        slug: 'my-stake',
        disabled: myStakeDisabled,
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
    ];
  }, [requests, stakedData]);

  return <TabsPageLayout title="Tezos Staking" tabs={tabs} />;
});
