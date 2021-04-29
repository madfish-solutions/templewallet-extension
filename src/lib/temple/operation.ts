import {
  BlockResponse,
  OperationEntry,
  OperationContentsAndResultOrigination,
} from "@taquito/rpc";
import { TezosToolkit, OpKind } from "@taquito/taquito";

export const SYNC_INTERVAL = 10_000;
export const CONFIRM_TIMEOUT = 60_000 * 5;

export type ConfirmOperationOptions = {
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
    throw new Error("Confirmation polling timed out");
  }

  const startedAt = Date.now();
  let currentBlockLevel;

  try {
    const currentBlock = await tezos.rpc.getBlock();
    currentBlockLevel = currentBlock.header.level;

    for (
      let i = fromBlockLevel ?? currentBlockLevel;
      i <= currentBlockLevel;
      i++
    ) {
      const block =
        i === currentBlockLevel
          ? currentBlock
          : await tezos.rpc.getBlock({ block: i as any });

      const opEntry = await findOperation(block, opHash);
      if (opEntry) {
        return opEntry;
      }
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error(err);
    }
  }

  if (signal?.aborted) {
    throw new Error("Cancelled");
  }

  const timeToWait = Math.max(startedAt + SYNC_INTERVAL - Date.now(), 0);
  await new Promise((r) => setTimeout(r, timeToWait));

  return confirmOperation(tezos, opHash, {
    initializedAt,
    fromBlockLevel: currentBlockLevel ? currentBlockLevel + 1 : fromBlockLevel,
    signal,
  });
}

export async function findOperation(block: BlockResponse, opHash: string) {
  for (let i = 3; i >= 0; i--) {
    for (const op of block.operations[i]) {
      if (op.hash === opHash) {
        return op;
      }
    }
  }
  return null;
}

export function getOriginatedContractAddress(opEntry: OperationEntry) {
  const results = Array.isArray(opEntry.contents)
    ? opEntry.contents
    : [opEntry.contents];
  const originationOp = results.find((op) => op.kind === OpKind.ORIGINATION) as
    | OperationContentsAndResultOrigination
    | undefined;
  return (
    originationOp?.metadata?.operation_result?.originated_contracts?.[0] ?? null
  );
}
