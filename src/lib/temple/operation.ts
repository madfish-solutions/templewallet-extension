import type { TezosToolkit } from '@taquito/taquito';

export async function confirmOperation(tezos: TezosToolkit, opHash: string) {
  return tezos.operation
    .createOperation(opHash)
    .then(op => op.confirmation(1))
    .then(confirmation => {
      if (!confirmation) throw new Error('Operation was not confirmed');
    });
}
