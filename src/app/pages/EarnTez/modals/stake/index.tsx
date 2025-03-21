import React, { memo, useCallback, useMemo, useState } from 'react';

import BigNumber from 'bignumber.js';

import { BackButton, PageModal } from 'app/atoms/PageModal';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { T } from 'lib/i18n';
import { AccountForTezos } from 'temple/accounts';
import { TezosChain } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { AmountInputContent } from './amount-input-content';
import { ConfirmStakeContent } from './confirm-stake-content';
import { ReviewData } from './types';

interface StakeModalProps {
  account: AccountForTezos;
  network: TezosChain;
  bakerPkh?: string;
  onClose: EmptyFn;
}

enum StakeModalStep {
  AmountInput = 'amount-input',
  Confirm = 'confirm'
}

interface StakeModalStateBase {
  step: StakeModalStep;
}

interface AmountInputState extends StakeModalStateBase {
  step: StakeModalStep.AmountInput;
}

interface ConfirmState extends StakeModalStateBase {
  step: StakeModalStep.Confirm;
  amount: BigNumber;
}

type StakeModalState = AmountInputState | ConfirmState;

export const StakeModal = memo<StakeModalProps>(({ account, network, bakerPkh, onClose }) => {
  if (!bakerPkh) {
    throw new DeadEndBoundaryError();
  }

  const [stakeModalState, setStakeModalState] = useState<StakeModalState>({
    step: StakeModalStep.AmountInput
  });
  const isAmountInputStep = stakeModalState.step === StakeModalStep.AmountInput;

  const goToAmountInput = useCallback(() => setStakeModalState({ step: StakeModalStep.AmountInput }), []);
  const handleAmountSubmit = useCallback(
    ({ amount }: { amount: string }) =>
      setStakeModalState({ step: StakeModalStep.Confirm, amount: new BigNumber(amount) }),
    []
  );

  const reviewData = useMemo<ReviewData | undefined>(
    () =>
      stakeModalState.step === StakeModalStep.Confirm
        ? {
            amount: stakeModalState.amount,
            onConfirm: onClose,
            network: { ...network, kind: TempleChainKind.Tezos },
            account
          }
        : undefined,
    [stakeModalState, onClose, network, account]
  );

  return (
    <PageModal
      title={isAmountInputStep ? <T id="tezosStaking" /> : <T id="confirmStake" />}
      opened
      titleRight={isAmountInputStep ? undefined : null}
      titleLeft={isAmountInputStep ? null : <BackButton onClick={goToAmountInput} />}
      onRequestClose={onClose}
    >
      {stakeModalState.step === StakeModalStep.AmountInput ? (
        <AmountInputContent network={network} account={account} bakerPkh={bakerPkh} onSubmit={handleAmountSubmit} />
      ) : (
        <ConfirmStakeContent reviewData={reviewData} onCancel={goToAmountInput} />
      )}
    </PageModal>
  );
});
