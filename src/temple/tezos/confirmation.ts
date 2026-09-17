import type { TezosToolkit } from '@taquito/taquito';

export const TEZOS_OPERATION_NOT_CONFIRMED_ERROR_MSG = 'Operation was not confirmed';
export const TEZOS_CONFIRMATION_TIMED_OUT_ERROR_MSG = 'Confirmation polling timed out';

interface ConfirmTezosOperationOptions {
  startingBlockLevel: number;
  timeoutMs: number;
  confirmations?: number;
}

export const confirmTezosOperation = (
  tezos: TezosToolkit,
  opHash: string,
  { startingBlockLevel, timeoutMs, confirmations = 1 }: ConfirmTezosOperationOptions
) =>
  Promise.race([
    tezos.operation
      // By level, not hash: Taquito reads this block back, and some nodes serve hash-addressed reads orders of magnitude slower
      .createOperation(opHash, { blockIdentifier: String(startingBlockLevel) })
      .then(op => op.confirmation(confirmations))
      .then(confirmation => {
        if (!confirmation) throw new Error(TEZOS_OPERATION_NOT_CONFIRMED_ERROR_MSG);
      }),
    new Promise<never>(
      (_, reject) => void setTimeout(() => void reject(new Error(TEZOS_CONFIRMATION_TIMED_OUT_ERROR_MSG)), timeoutMs)
    )
  ]);
