import React, { memo, useCallback, useMemo, useState } from 'react';

import { PageLoader } from 'app/atoms/Loader';
import { BackButton, CLOSE_ANIMATION_TIMEOUT, PageModal } from 'app/atoms/PageModal';
import { toastSuccess } from 'app/toaster';
import { T, t } from 'lib/i18n';
import { Baker } from 'lib/temple/front';
import { AccountForTezos } from 'temple/accounts';
import { TezosChain } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { ConfirmDelegationContent } from './confirm-delegation-content';
import { SelectBakerContent } from './select-baker-content';
import { ReviewData } from './types';

interface DelegationModalProps {
  account: AccountForTezos;
  network: TezosChain;
  bakerPkh?: string;
  onClose: EmptyFn;
}

enum DelegationModalStep {
  SelectBaker = 'select-baker',
  ConfirmDelegation = 'confirm-delegation'
}

interface DelegationModalStateBase {
  step: DelegationModalStep;
}

interface SelectBakerState extends DelegationModalStateBase {
  step: DelegationModalStep.SelectBaker;
}

interface ConfirmDelegationState extends DelegationModalStateBase {
  step: DelegationModalStep.ConfirmDelegation;
  baker: string | Baker;
}

type DelegationModalState = SelectBakerState | ConfirmDelegationState;

export const DelegationModal = memo<DelegationModalProps>(({ account, bakerPkh, network, onClose }) => {
  const [delegationModalState, setDelegationModalState] = useState<DelegationModalState>({
    step: DelegationModalStep.SelectBaker
  });
  const isSelectBakerStep = delegationModalState.step === DelegationModalStep.SelectBaker;

  const goToSelectBaker = useCallback(() => setDelegationModalState({ step: DelegationModalStep.SelectBaker }), []);
  const handleBakerSelect = useCallback(
    (baker: string | Baker) => setDelegationModalState({ step: DelegationModalStep.ConfirmDelegation, baker }),
    []
  );
  const handleSuccess = useCallback(() => {
    setTimeout(() => toastSuccess(t('successfullyDelegated')), CLOSE_ANIMATION_TIMEOUT * 2);
    onClose();
  }, [onClose]);

  const reviewData = useMemo<ReviewData | undefined>(
    () =>
      delegationModalState.step === DelegationModalStep.ConfirmDelegation
        ? {
            baker: delegationModalState.baker,
            onConfirm: handleSuccess,
            network: { ...network, kind: TempleChainKind.Tezos },
            account
          }
        : undefined,
    [delegationModalState, handleSuccess, network, account]
  );

  return (
    <PageModal
      title={
        isSelectBakerStep ? <T id="selectBaker" /> : <T id="confirmAction" substitutions={<T id="delegation" />} />
      }
      opened
      suspenseLoader={<PageLoader stretch text={isSelectBakerStep ? t('bakersAreLoading') : undefined} />}
      titleRight={isSelectBakerStep ? undefined : null}
      titleLeft={isSelectBakerStep ? null : <BackButton onClick={goToSelectBaker} />}
      onRequestClose={onClose}
    >
      {delegationModalState.step === DelegationModalStep.SelectBaker ? (
        <SelectBakerContent network={network} account={account} bakerPkh={bakerPkh} onSelect={handleBakerSelect} />
      ) : (
        <ConfirmDelegationContent reviewData={reviewData} onCancel={goToSelectBaker} />
      )}
    </PageModal>
  );
});
