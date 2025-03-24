import { OpKind, TezosToolkit, WalletParamsWithKind } from '@taquito/taquito';
import BigNumber from 'bignumber.js';
import { noop } from 'lodash';

import { TempleAccountType } from 'lib/temple/types';
import { AccountForTezos } from 'temple/accounts';

import { makeEstimateOperation, makeGetRawOperationEstimate } from '../../estimate-earn-operation';

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

export const getRawUnstakingEstimate = makeGetRawOperationEstimate(getUnstakingParams);

export const estimateUnstaking = makeEstimateOperation<[BigNumber], [BigNumber]>(getRawUnstakingEstimate, noop, err => {
  throw err;
});
