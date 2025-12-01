import React, { memo, useCallback } from 'react';

import BigNumber from 'bignumber.js';

import { PageLoader } from 'app/atoms/Loader';
import { T, t } from 'lib/i18n';
import { EvmChain, useAccountForEvm } from 'temple/front';

import { EarnOperationModal, EarnOperationModalProps } from '../components/earn-operation-modal';
import { EthStakingStats } from '../types';

import { UnstakeAmountInputContent } from './amount-input-content';
import { ConfirmUnstakeContent } from './confirm-unstake-content';
import { ReviewData } from './types';

interface UnstakeModalProps {
  chain: EvmChain;
  stats: EthStakingStats;
  onRequestClose: EmptyFn;
}

type GenericModalProps = EarnOperationModalProps<{ amount: string }, ReviewData>;

const SuspenseLoader = () => <PageLoader stretch />;

export const UnstakeModal = memo<UnstakeModalProps>(({ chain, stats, onRequestClose }) => {
  const account = useAccountForEvm()!;

  const LocalAmountInputContent = useCallback<GenericModalProps['InputDataContent']>(
    ({ onSubmit, stats }) => <UnstakeAmountInputContent chain={chain} stats={stats} onSubmit={onSubmit} />,
    [chain]
  );

  const makeReviewData = useCallback<GenericModalProps['makeReviewData']>(
    ({ amount }, onSuccess) => ({
      amount: new BigNumber(amount),
      onConfirm: onSuccess,
      network: chain,
      account
    }),
    [account, chain]
  );

  return (
    <EarnOperationModal
      inputDataStepTitle={<T id="unstakeEth" />}
      confirmStepTitle={<T id="confirmAction" substitutions={<T id="unstake" />} />}
      successToastText={t('transactionSubmitted')}
      network={chain}
      stats={stats}
      SuspenseLoader={SuspenseLoader}
      InputDataContent={LocalAmountInputContent}
      ConfirmContent={ConfirmUnstakeContent}
      makeReviewData={makeReviewData}
      onClose={onRequestClose}
    />
  );
});
