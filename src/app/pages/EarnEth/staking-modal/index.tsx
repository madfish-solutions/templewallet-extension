import React, { memo, useCallback } from 'react';

import BigNumber from 'bignumber.js';

import { PageLoader } from 'app/atoms/Loader';
import { T, t } from 'lib/i18n';
import { useEvmGasMetadata } from 'lib/metadata';
import { EvmChain, useAccountForEvm } from 'temple/front';
import { DEFAULT_EVM_CURRENCY } from 'temple/networks';

import { EarnOperationModal, EarnOperationModalProps } from '../components/earn-operation-modal';
import { EthEarnReviewDataBase, EthStakingStats } from '../types';

import { StakeAmountInputContent } from './amount-input-content';
import { ConfirmStakeContent } from './confirm-stake-content';

interface StakingModalProps {
  chain: EvmChain;
  stats: EthStakingStats;
  onRequestClose: EmptyFn;
}

interface ReviewData extends EthEarnReviewDataBase {
  amount: BigNumber;
}

type GenericModalProps = EarnOperationModalProps<{ amount: string }, ReviewData>;

const SuspenseLoader = () => <PageLoader stretch />;

export const StakingModal = memo<StakingModalProps>(({ chain, stats, onRequestClose }) => {
  const { symbol: ethSymbol } = useEvmGasMetadata(chain.chainId) ?? DEFAULT_EVM_CURRENCY;
  const account = useAccountForEvm()!;

  const LocalAmountInputContent = useCallback<GenericModalProps['InputDataContent']>(
    ({ onSubmit }) => <StakeAmountInputContent chain={chain} account={account} stats={stats} onSubmit={onSubmit} />,
    [account, chain, stats]
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
      inputDataStepTitle={<T id="currencyStaking" substitutions={ethSymbol} />}
      confirmStepTitle={<T id="confirmAction" substitutions={<T id="stake" />} />}
      successToastText={t('transactionSubmitted')}
      network={chain}
      SuspenseLoader={SuspenseLoader}
      InputDataContent={LocalAmountInputContent}
      ConfirmContent={ConfirmStakeContent}
      makeReviewData={makeReviewData}
      onClose={onRequestClose}
    />
  );
});
