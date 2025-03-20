import React, { FC, memo, useCallback } from 'react';

import { RedelegateButton } from 'app/atoms/BakingButtons';
import { ScrollView } from 'app/atoms/ScrollView';
import { BakerCard } from 'app/templates/baker-card';
import { T } from 'lib/i18n';
import { TezosNetworkEssentials } from 'temple/networks';

import { BakingSectionSelectors } from './selectors';
import { TezosStakingList } from './tezos-staking-list';

interface Props {
  network: TezosNetworkEssentials;
  accountPkh: string;
  bakerPkh: string;
  cannotDelegate: boolean;
}

export const BakerBannerWithStake = memo<Props>(({ network, accountPkh, bakerPkh, cannotDelegate }) => {
  const BakerBannerHeaderRight = useCallback<FC<{ staked: number }>>(
    ({ staked }) => (
      <RedelegateButton
        disabled={cannotDelegate}
        staked={staked > 0}
        testID={BakingSectionSelectors.reDelegateButton}
      />
    ),
    [cannotDelegate]
  );

  return (
    <ScrollView className="p-4">
      <div className="flex flex-col gap-1 mb-6">
        <span className="my-1 text-font-description-bold">
          <T id="delegation" />
        </span>

        <BakerCard network={network} accountPkh={accountPkh} bakerPkh={bakerPkh} HeaderRight={BakerBannerHeaderRight} />
      </div>

      <TezosStakingList network={network} accountPkh={accountPkh} bakerPkh={bakerPkh} cannotDelegate={cannotDelegate} />
    </ScrollView>
  );
});
