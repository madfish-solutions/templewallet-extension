import { OpKind, TezosToolkit, WalletParamsWithKind } from '@taquito/taquito';
import BigNumber from 'bignumber.js';
import { noop } from 'lodash';

import { TempleAccountType } from 'lib/temple/types';
import { AccountForTezos } from 'temple/accounts';

import { makeEstimateOperation, makeGetRawOperationEstimate } from './estimate-earn-operation';

export const getStakingParams = async (
  account: AccountForTezos,
  _: TezosToolkit,
  amount: BigNumber
): Promise<WalletParamsWithKind[]> => {
  if (account.type === TempleAccountType.ManagedKT) {
    throw new Error('Staking is not supported for managed accounts');
  }

  return [
    {
      kind: OpKind.TRANSACTION,
      amount: amount.toNumber(),
      to: account.address,
      parameter: { entrypoint: 'stake', value: { prim: 'Unit' } }
    }
  ];
};

export const getRawStakingEstimate = makeGetRawOperationEstimate(getStakingParams);

export const isStakingNotAcceptedError = (err: any) =>
  err instanceof Error && err.message.includes('staking_to_delegate_that_refuses_external_staking');

export const estimateStaking = makeEstimateOperation<[BigNumber], [BigNumber]>(getRawStakingEstimate, noop, err => {
  throw err;
});
