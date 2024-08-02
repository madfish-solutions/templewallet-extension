import React, { memo, useMemo } from 'react';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { useManagableTezosStakeInfo } from 'app/hooks/use-baking-hooks';
import { TabInterface, TabsPageLayout } from 'app/layouts/TabsPageLayout';
import { TempleAccountType } from 'lib/temple/types';
import { useAccountForTezos, useTezosChainByChainId } from 'temple/front';

import { MyStakeTab } from './MyStake';
import { NewStakeTab } from './NewStake';
import { StakingPageSelectors } from './selectors';

interface Props {
  tezosChainId: string;
}

export const StakingPage = memo<Props>(({ tezosChainId }) => {
  const account = useAccountForTezos();
  const network = useTezosChainByChainId(tezosChainId);

  if (!network || !account) throw new DeadEndBoundaryError();

  const accountPkh = account.address;
  const rpcBaseURL = network.rpcBaseURL;
  const cannotDelegate = account.type === TempleAccountType.WatchOnly;

  const { mayManage, requestsN } = useManagableTezosStakeInfo(rpcBaseURL, accountPkh);

  const tabs = useMemo<NonEmptyArray<TabInterface>>(
    () => [
      {
        slug: 'new-stake',
        title: 'New stake',
        Component: () => <NewStakeTab accountPkh={accountPkh} network={network} cannotDelegate={cannotDelegate} />,
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
        Component: () => <MyStakeTab accountPkh={accountPkh} network={network} cannotDelegate={cannotDelegate} />,
        testID: StakingPageSelectors.myStakeTab
      }
    ],
    [mayManage, requestsN, network, cannotDelegate, accountPkh]
  );

  return <TabsPageLayout title="Tezos Staking" tabs={tabs} />;
});
