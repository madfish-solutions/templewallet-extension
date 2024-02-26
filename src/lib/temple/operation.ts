import type { TezosToolkit } from '@taquito/taquito';

import { BLOCK_DURATION } from 'lib/fixed-times';

const TIMEOUT = 3 * BLOCK_DURATION;
export const CONFIRMATION_TIMED_OUT_ERROR_MSG = 'Confirmation polling timed out';

export const confirmOperation = (tezos: TezosToolkit, opHash: string) =>
  Promise.race([
    tezos.operation
      .createOperation(opHash)
      .then(op => op.confirmation(1))
      .then(confirmation => {
        if (!confirmation) throw new Error('Operation was not confirmed');
      }),
    new Promise((_, reject) => void setTimeout(() => void reject(new Error(CONFIRMATION_TIMED_OUT_ERROR_MSG)), TIMEOUT))
  ]);
