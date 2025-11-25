import { ContractViewsStats } from '@temple-wallet/everstake-wallet-sdk';

import { EvmReviewData } from 'lib/temple/front/estimation-data-providers';

export type EthEarnReviewDataBase = EvmReviewData<{ onConfirm: SyncFn<string> }>;

export type EthStakingStats = ContractViewsStats &
  Record<
    'validator_activation_time' | 'validator_adding_delay' | 'validator_exit_time' | 'validator_withdraw_time',
    number
  >;
