import { OpKind, TezosToolkit, WalletParamsWithKind, getRevealFee } from '@taquito/taquito';
import BigNumber from 'bignumber.js';

import { setDelegate } from 'lib/michelson';
import { loadContract } from 'lib/temple/contract';
import { mutezToTz } from 'lib/temple/helpers';
import { tezosManagerKeyHasManager } from 'lib/tezos';
import { ZERO } from 'lib/utils/numbers';
import { serializeEstimate } from 'lib/utils/serialize-estimate';
import { AccountForTezos } from 'temple/accounts';

export const getDelegationParams = async (
  account: AccountForTezos,
  delegateAddress: string,
  tezos: TezosToolkit
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

export const getRawDelegationEstimate = async (
  account: AccountForTezos,
  delegateAddress: string,
  tezos: TezosToolkit
) => {
  const { address, ownerAddress } = account;
  const walletParams = await getDelegationParams(account, delegateAddress, tezos);

  return await tezos.estimate.batch(walletParams.map(params => ({ ...params, source: ownerAddress || address })));
};

export const isRpcUnregisteredDelegateError = (err: any) => err?.id.includes('unregistered_delegate');

export const estimateDelegation = async (
  account: AccountForTezos,
  balance: BigNumber,
  delegateAddress: string | nullish,
  tezos: TezosToolkit
) => {
  if (!delegateAddress) {
    throw new Error('No delegate address provided');
  }

  const { ownerAddress, address: accountPkh } = account;
  try {
    const [[estmtn], manager] = await Promise.all([
      getRawDelegationEstimate(account, delegateAddress, tezos),
      tezos.rpc.getManagerKey(ownerAddress || accountPkh)
    ]);

    const revealFeeMutez =
      tezosManagerKeyHasManager(manager) || ownerAddress ? ZERO : mutezToTz(getRevealFee(accountPkh));
    const estimatedBaseFee = mutezToTz(estmtn.burnFeeMutez + estmtn.suggestedFeeMutez).plus(revealFeeMutez);

    if (estimatedBaseFee.isGreaterThanOrEqualTo(balance)) {
      throw new Error('Not enough funds');
    }

    return {
      baseFee: estimatedBaseFee,
      gasFee: mutezToTz(estmtn.suggestedFeeMutez).plus(revealFeeMutez),
      revealFee: revealFeeMutez,
      estimates: [serializeEstimate(estmtn)]
    };
  } catch (err: any) {
    if (['delegate.unchanged', 'delegate.already_active'].some(errorLabel => err?.id.includes(errorLabel))) {
      throw new Error('No delegate change');
    }

    if (isRpcUnregisteredDelegateError(err)) {
      throw new Error('Unregistered delegate');
    }

    throw err;
  }
};
