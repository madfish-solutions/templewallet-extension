import React, { memo } from 'react';

import { Alert } from 'app/atoms';
import { T } from 'lib/i18n';
import { formatDuration } from 'lib/i18n/core';
import { EvmChain } from 'temple/front';

import { AmountInputContent } from '../components/amount-input-content';
import { EthStakingStats } from '../types';

import { UnstakeEthModalSelectors } from './selectors';

interface FormValues {
  amount: string;
}

interface AmountInputContentProps {
  chain: EvmChain;
  stats: EthStakingStats;
  onSubmit: SyncFn<FormValues>;
}

export const UnstakeAmountInputContent = memo<AmountInputContentProps>(({ chain, stats, onSubmit }) => {
  return (
    <AmountInputContent
      formId="unstake-amount-form"
      submitButtonTestID={UnstakeEthModalSelectors.unstakeButton}
      submitButtonLabel={<T id="unstake" />}
      maxAmountLabel={<T id="balance" />}
      maxAmount={stats.depositedBalanceOf}
      maxAmountLabelValue={stats.depositedBalanceOf}
      maxButtonTestID={UnstakeEthModalSelectors.maxButton}
      amountInputTestID={UnstakeEthModalSelectors.amountInput}
      placeholder="0.00"
      network={chain}
      stats={stats}
      onSubmit={onSubmit}
    >
      <Alert
        className="mb-4"
        type="info"
        description={
          <T
            id="ethUnstakingDisclaimer"
            substitutions={formatDuration(stats.validator_exit_time + stats.validator_withdraw_time, ['days'])}
          />
        }
      />
    </AmountInputContent>
  );
});
