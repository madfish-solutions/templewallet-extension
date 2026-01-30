import { OpKind } from '@taquito/rpc';
import { TezosToolkit, WalletParamsWithKind } from '@tezos-x/octez.js';
import BigNumber from 'bignumber.js';
import { noop } from 'lodash';

import { TempleAccountType } from 'lib/temple/types';
import { AccountForTezos } from 'temple/accounts';

import { makeUseEstimationData } from '../../estimate-earn-operation';

import { ReviewData } from './types';

export const getUnstakingParams = async (
  account: AccountForTezos,
  _: TezosToolkit,
  amount: BigNumber
): Promise<WalletParamsWithKind[]> => {
  if (account.type === TempleAccountType.ManagedKT) {
    throw new Error('Unstaking is not supported for managed accounts');
  }

  return [
    {
      kind: OpKind.TRANSACTION,
      amount: amount.toNumber(),
      to: account.address,
      parameter: { entrypoint: 'unstake', value: { prim: 'Unit' } }
    }
  ];
};

export const useUnstakingEstimationData = makeUseEstimationData<[BigNumber], [BigNumber], ReviewData>(
  getUnstakingParams,
  noop,
  ({ amount }) => [amount],
  ({ amount, network }, account, tezBalance) => [
    'estimate-unstaking',
    amount.toFixed(),
    account.address,
    tezBalance.toFixed(),
    network.rpcBaseURL
  ]
);
