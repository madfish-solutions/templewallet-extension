import { RpcReadAdapter } from '@taquito/taquito';

import { TezosNetworkEssentials } from 'temple/networks';
import { getTezosRpcClient } from 'temple/tezos';

import { SaplingContractTransaction } from '../types';

import { withUnlocked } from './store';

export function getSaplingCredentials(accountId: string) {
  return withUnlocked(async ({ vault }) => {
    return await vault.getSaplingCredentials(accountId);
  });
}

export function prepareSaplingTransaction(
  accountId: string,
  transaction: SaplingContractTransaction,
  network: TezosNetworkEssentials,
  saplingContractAddress: string
) {
  return withUnlocked(async ({ vault }) => {
    return await vault.prepareSaplingTransaction(
      accountId,
      transaction,
      new RpcReadAdapter(getTezosRpcClient(network)),
      saplingContractAddress
    );
  });
}
