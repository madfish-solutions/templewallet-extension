import { OpKind, WalletParamsWithKind } from '@taquito/taquito';
import { noop } from 'lodash';

import { TempleAccountType } from 'lib/temple/types';
import { AccountForTezos } from 'temple/accounts';

import { makeUseEstimationData } from '../../estimate-earn-operation';
import { TezosEarnReviewDataBase } from '../../types';

export const getFinalizationParams = async (account: AccountForTezos): Promise<WalletParamsWithKind[]> => {
  if (account.type === TempleAccountType.ManagedKT) {
    throw new Error('Finalization is not supported for managed accounts');
  }

  return [
    {
      kind: OpKind.TRANSACTION,
      amount: 0,
      to: account.address,
      parameter: { entrypoint: 'finalize_unstake', value: { prim: 'Unit' } }
    }
  ];
};

export const useFinalizationEstimationData = makeUseEstimationData<[], [], TezosEarnReviewDataBase>(
  getFinalizationParams,
  noop,
  () => [],
  ({ network }, account, tezBalance) => [
    'estimate-finalization',
    account.address,
    tezBalance.toFixed(),
    network.rpcBaseURL
  ]
);
