import { OpKind, TezosToolkit, WalletParamsWithKind } from '@taquito/taquito';

import { setDelegate } from 'lib/michelson';
import { loadContract } from 'lib/temple/contract';
import { AccountForTezos } from 'temple/accounts';

import { makeEstimateOperation, makeGetRawOperationEstimate } from '../../estimate-earn-operation';

export const getDelegationParams = async (
  account: AccountForTezos,
  tezos: TezosToolkit,
  delegateAddress: string
): Promise<WalletParamsWithKind[]> => {
  const { ownerAddress, address: accountPkh } = account;

  if (ownerAddress) {
    const contract = await loadContract(tezos, accountPkh);

    return [
      {
        kind: OpKind.TRANSACTION,
        ...contract.methodsObject.do(setDelegate(delegateAddress)).toTransferParams()
      }
    ];
  }

  return [{ kind: OpKind.DELEGATION, delegate: delegateAddress }];
};

export const getRawDelegationEstimate = makeGetRawOperationEstimate(getDelegationParams);

export const isRpcUnregisteredDelegateError = (err: any) => err?.id.includes('unregistered_delegate');

export const estimateDelegation = makeEstimateOperation<[string | nullish], [string]>(
  getRawDelegationEstimate,
  args => {
    if (!args[0]) {
      throw new Error('No delegate address provided');
    }
  },
  err => {
    if (['delegate.unchanged', 'delegate.already_active'].some(errorLabel => err?.id.includes(errorLabel))) {
      throw new Error('No delegate change');
    }

    if (isRpcUnregisteredDelegateError(err)) {
      throw new Error('Unregistered delegate');
    }

    throw err;
  }
);
