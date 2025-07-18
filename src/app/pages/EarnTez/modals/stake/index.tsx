import React, { memo, useCallback } from 'react';

import BigNumber from 'bignumber.js';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { T, t } from 'lib/i18n';
import { AccountForTezos } from 'temple/accounts';
import { TezosChain } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { EarnOperationModal, EarnOperationModalProps } from '../../components/earn-operation-modal';

import { StakeAmountInputContent } from './amount-input-content';
import { ConfirmStakeContent } from './confirm-stake-content';
import { ReviewData } from './types';

interface StakeModalProps {
  account: AccountForTezos;
  network: TezosChain;
  bakerPkh?: string;
  onClose: EmptyFn;
}

type GenericModalProps = EarnOperationModalProps<{ amount: string }, ReviewData>;

export const StakeModal = memo<StakeModalProps>(({ account, network, bakerPkh, onClose }) => {
  if (!bakerPkh) {
    throw new DeadEndBoundaryError();
  }

  const LocalAmountInputContent = useCallback<GenericModalProps['InputDataContent']>(
    ({ onSubmit }) => (
      <StakeAmountInputContent network={network} account={account} bakerPkh={bakerPkh} onSubmit={onSubmit} />
    ),
    [account, bakerPkh, network]
  );

  const makeReviewData = useCallback<GenericModalProps['makeReviewData']>(
    ({ amount }, onSuccess) => ({
      amount: new BigNumber(amount),
      onConfirm: onSuccess,
      network: { ...network, kind: TempleChainKind.Tezos },
      account
    }),
    [account, network]
  );

  return (
    <EarnOperationModal
      inputDataStepTitle={<T id="tezosStaking" />}
      confirmStepTitle={<T id="confirmAction" substitutions={<T id="staking" />} />}
      successToastText={t('transactionSubmitted')}
      network={network}
      InputDataContent={LocalAmountInputContent}
      ConfirmContent={ConfirmStakeContent}
      makeReviewData={makeReviewData}
      onClose={onClose}
    />
  );
});
