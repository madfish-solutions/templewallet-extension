import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Button, IconBase } from 'app/atoms';
import { PageLoader } from 'app/atoms/Loader';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { ReactComponent as ActivityIcon } from 'app/icons/base/activity.svg';
import PageLayout from 'app/layouts/PageLayout';
import { isKnownChainId } from 'lib/apis/tzkt';
import { useTezosGasMetadata } from 'lib/metadata';
import { useDelegate } from 'lib/temple/front';
import { TempleAccountType } from 'lib/temple/types';
import { useBooleanState } from 'lib/ui/hooks';
import { useAccountForTezos, useOnTezosBlock, useTezosChainByChainId } from 'temple/front';
import { isTezosDcpChainId } from 'temple/networks';

import { BakerContent } from './baker-content';
import { DelegationModal } from './modals/delegation';
import { FinalizeModal } from './modals/finalize';
import { RewardsModal } from './modals/rewards';
import { StakeModal } from './modals/stake';
import { UnstakeModal } from './modals/unstake';
import { NoBakerContent } from './no-baker-content';
import { EarnTezSelectors } from './selectors';

interface Props {
  tezosChainId: string;
}

export const EarnTezPage = memo<Props>(({ tezosChainId }) => {
  const account = useAccountForTezos();
  const [bakerAddress, setBakerAddress] = useState<string | null>();
  const [rewardsModalIsOpen, openRewardsModal, closeRewardsModal] = useBooleanState(false);
  const { symbol } = useTezosGasMetadata(tezosChainId);

  if (!account) throw new DeadEndBoundaryError();

  return (
    <>
      <PageLayout
        pageTitle={`Earn ${symbol}`}
        contentPadding={false}
        contentClassName={bakerAddress !== null ? '' : '!bg-white'}
        headerRightElem={
          bakerAddress && isKnownChainId(tezosChainId) && !isTezosDcpChainId(tezosChainId) ? (
            <Button testID={EarnTezSelectors.activityButton} onClick={openRewardsModal}>
              <IconBase size={16} Icon={ActivityIcon} className="text-primary" />
            </Button>
          ) : null
        }
        loader={<PageLoader stretch />}
      >
        <EarnTezPageContent chainId={tezosChainId} onBakerAddress={setBakerAddress} />
      </PageLayout>
      <RewardsModal
        account={account}
        bakerAddress={bakerAddress}
        chainId={tezosChainId}
        isOpen={rewardsModalIsOpen}
        onClose={closeRewardsModal}
      />
    </>
  );
});

interface EarnTezPageContentProps {
  chainId: string;
  onBakerAddress: SyncFn<string | null>;
}

enum EarnTezPageContentModal {
  Delegation = 'delegation',
  Finalize = 'finalize',
  Stake = 'stake',
  Unstake = 'unstake'
}

const modals = {
  [EarnTezPageContentModal.Delegation]: DelegationModal,
  [EarnTezPageContentModal.Finalize]: FinalizeModal,
  [EarnTezPageContentModal.Stake]: StakeModal,
  [EarnTezPageContentModal.Unstake]: UnstakeModal
};

const EarnTezPageContent = memo<EarnTezPageContentProps>(({ chainId, onBakerAddress }) => {
  const network = useTezosChainByChainId(chainId);
  const account = useAccountForTezos();
  const [currentModal, setCurrentModal] = useState<EarnTezPageContentModal | null>(null);
  const openModalFactory = useCallback((modal: EarnTezPageContentModal) => () => setCurrentModal(modal), []);
  const closeCurrentModal = useCallback(() => setCurrentModal(null), []);
  const openDelegationModal = useMemo(() => openModalFactory(EarnTezPageContentModal.Delegation), [openModalFactory]);
  const openFinalizeModal = useMemo(() => openModalFactory(EarnTezPageContentModal.Finalize), [openModalFactory]);
  const openStakeModal = useMemo(() => openModalFactory(EarnTezPageContentModal.Stake), [openModalFactory]);
  const openUnstakeModal = useMemo(() => openModalFactory(EarnTezPageContentModal.Unstake), [openModalFactory]);
  const Modal = currentModal && modals[currentModal];

  if (!network || !account) throw new DeadEndBoundaryError();

  const accountPkh = account.address;
  const cannotDelegate = account.type === TempleAccountType.WatchOnly;

  const { data: myBakerPkh, mutate: updateBakerPkh } = useDelegate(accountPkh, network, true, false);
  useEffect(() => void (myBakerPkh !== undefined && onBakerAddress(myBakerPkh)), [myBakerPkh, onBakerAddress]);

  useOnTezosBlock(network.rpcBaseURL, () => void updateBakerPkh());

  return (
    <>
      {myBakerPkh ? (
        <BakerContent
          network={network}
          account={account}
          bakerPkh={myBakerPkh}
          cannotDelegate={cannotDelegate}
          openDelegationModal={openDelegationModal}
          openFinalizeModal={openFinalizeModal}
          openStakeModal={openStakeModal}
          openUnstakeModal={openUnstakeModal}
        />
      ) : (
        <NoBakerContent cannotDelegate={cannotDelegate} openDelegationModal={openDelegationModal} />
      )}
      {Modal && (
        <Modal network={network} account={account} bakerPkh={myBakerPkh ?? undefined} onClose={closeCurrentModal} />
      )}
    </>
  );
});
