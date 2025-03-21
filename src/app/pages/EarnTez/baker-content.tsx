import React, { FC, memo, useCallback } from 'react';

import { RedelegateButton } from 'app/atoms/BakingButtons';
import { ScrollView } from 'app/atoms/PageModal/scroll-view';
import { T } from 'lib/i18n';
import { AccountForTezos } from 'temple/accounts';
import { TezosNetworkEssentials, isTezosDcpChainId } from 'temple/networks';

import { BakerCard } from './components/baker-card';
import { EarnTezSelectors } from './selectors';
import { TezosStakingList } from './tezos-staking-list';

interface BakerContentProps {
  network: TezosNetworkEssentials;
  account: AccountForTezos;
  bakerPkh: string;
  cannotDelegate: boolean;
  openDelegationModal: EmptyFn;
  openFinalizeModal: EmptyFn;
  openStakeModal: EmptyFn;
  openUnstakeModal: EmptyFn;
}

export const BakerContent = memo<BakerContentProps>(
  ({
    network,
    account,
    bakerPkh,
    cannotDelegate,
    openDelegationModal,
    openFinalizeModal,
    openStakeModal,
    openUnstakeModal
  }) => {
    const BakerBannerHeaderRight = useCallback<FC<{ staked: number }>>(
      ({ staked }) => (
        <RedelegateButton
          disabled={cannotDelegate}
          staked={staked > 0}
          onConfirm={openDelegationModal}
          testID={EarnTezSelectors.redelegateButton}
        />
      ),
      [cannotDelegate, openDelegationModal]
    );

    return (
      <ScrollView className="p-4">
        <div className="flex flex-col gap-1 mb-6">
          <span className="my-1 text-font-description-bold">
            <T id="delegation" />
          </span>

          <BakerCard
            network={network}
            accountPkh={account.address}
            baker={bakerPkh}
            HeaderRight={BakerBannerHeaderRight}
          />
        </div>

        {!isTezosDcpChainId(network.chainId) && (
          <TezosStakingList
            network={network}
            account={account}
            bakerPkh={bakerPkh}
            cannotDelegate={cannotDelegate}
            openFinalizeModal={openFinalizeModal}
            openStakeModal={openStakeModal}
            openUnstakeModal={openUnstakeModal}
          />
        )}
      </ScrollView>
    );
  }
);
