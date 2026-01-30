import type { TezosToolkit } from '@tezos-x/octez.js';

import { TEZOS_BLOCK_DURATION } from 'lib/fixed-times';

const TIMEOUT = 3 * TEZOS_BLOCK_DURATION;
export const TEZOS_OPERATION_NOT_CONFIRMED_ERROR_MSG = 'Operation was not confirmed';
export const TEZOS_CONFIRMATION_TIMED_OUT_ERROR_MSG = 'Confirmation polling timed out';

export const confirmTezosOperation = (tezos: TezosToolkit, opHash: string) =>
  Promise.race([
    tezos.operation
      .createOperation(opHash)
      .then(op => op.confirmation(1))
      .then(confirmation => {
        if (!confirmation) throw new Error(TEZOS_OPERATION_NOT_CONFIRMED_ERROR_MSG);
      }),
    new Promise(
      (_, reject) => void setTimeout(() => void reject(new Error(TEZOS_CONFIRMATION_TIMED_OUT_ERROR_MSG)), TIMEOUT)
    )
  ]);
