import { BlockResponse, OperationEntry } from '@taquito/rpc';
import { TezosToolkit } from '@taquito/taquito';

import { CONFIRM_TIMEOUT } from 'lib/fixed-times';

const SYNC_INTERVAL = 10_000;

type ConfirmOperationOptions = {
  initializedAt?: number;
  fromBlockLevel?: number;
  signal?: AbortSignal;
};

export async function confirmOperation(
  tezos: TezosToolkit,
  opHash: string,
  { initializedAt, fromBlockLevel, signal }: ConfirmOperationOptions = {}
): Promise<OperationEntry> {
  if (!initializedAt) initializedAt = Date.now();
  if (initializedAt && initializedAt + CONFIRM_TIMEOUT < Date.now()) {
    throw new Error('Confirmation polling timed out');
  }

  const startedAt = Date.now();
  let currentBlockLevel;

  try {
    const currentBlock = await tezos.rpc.getBlock();
    currentBlockLevel = currentBlock.header.level;

    for (let i = fromBlockLevel ?? currentBlockLevel; i <= currentBlockLevel; i++) {
      const block = i === currentBlockLevel ? currentBlock : await tezos.rpc.getBlock({ block: i as any });

      const opEntry = await findOperation(block, opHash);
      if (opEntry) {
        return formatOperationEntry(opEntry);
      }
    }
  } catch (err: any) {
    console.error(err);

    if (err instanceof FailedOpError) {
      throw err;
    }
  }

  if (signal?.aborted) {
    throw new Error('Cancelled');
  }

  const timeToWait = Math.max(startedAt + SYNC_INTERVAL - Date.now(), 0);
  await new Promise(r => setTimeout(r, timeToWait));

  return confirmOperation(tezos, opHash, {
    initializedAt,
    fromBlockLevel: currentBlockLevel ? currentBlockLevel + 1 : fromBlockLevel,
    signal
  });
}

async function findOperation(block: BlockResponse, opHash: string) {
  for (let i = 3; i >= 0; i--) {
    for (const op of block.operations[i]) {
      if (op.hash === opHash) {
        return op;
      }
    }
  }
  return null;
}

export class FailedOpError extends Error {}

const formatOperationEntry = (opEntry: OperationEntry) => {
  let status;
  try {
    status = (opEntry.contents[0] as any).metadata.operation_result.status;
  } catch {}
  if (status && status !== 'applied') {
    throw new FailedOpError(`Operation ${status}`);
  }

  return opEntry;
};
