import {
  BlockResponse,
  OperationEntry,
  OperationContentsAndResultOrigination,
} from "@taquito/rpc";
import {
  TezosToolkit,
  OpKind,
  WalletOperationBatch,
  WalletContract,
} from "@taquito/taquito";
import { OperationBatch } from "@taquito/taquito/dist/types/batch/rpc-batch-provider";
import { TransferParams } from "@taquito/taquito/dist/types/operations/types";
import BigNumber from "bignumber.js";

import { loadContract } from "lib/temple/front";

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
        let status;
        try {
          status = (opEntry.contents[0] as any).metadata.operation_result
            .status;
        } catch {}
        if (status && status !== "applied") {
          throw new FailedOpError(`Operation ${status}`);
        }

        return opEntry;
      }
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error(err);
    }

    if (err instanceof FailedOpError) {
      throw err;
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

export class FailedOpError extends Error {}

export const batchify = (
  batch: OperationBatch | WalletOperationBatch,
  transfers: TransferParams[]
) => transfers.reduce((b, tParams) => b.withTransfer(tParams), batch);

type TokenApproveParams = {
  tokenAddress: string;
  tokenId?: number;
  from: string;
  to: string;
  value: BigNumber;
};

function getFA12ApproveParams(
  tokenContract: WalletContract,
  to: string,
  value: BigNumber
) {
  return {
    kind: OpKind.TRANSACTION as const,
    ...tokenContract.methods.approve(to, value).toTransferParams(),
  };
}

export async function withTokenApprove(
  tezos: TezosToolkit,
  transfers: TransferParams[],
  { tokenAddress, tokenId, from, to, value }: TokenApproveParams
) {
  const tokenContract = await loadContract(tezos, tokenAddress);

  if (tokenId !== undefined) {
    return [
      tokenContract.methods
        .update_operators([
          {
            add_operator: {
              owner: from,
              operator: to,
              token_id: tokenId,
            },
          },
        ])
        .toTransferParams(),
      ...transfers,
      tokenContract.methods
        .update_operators([
          {
            remove_operator: {
              owner: from,
              operator: to,
              token_id: tokenId,
            },
          },
        ])
        .toTransferParams(),
    ];
  }

  const approveParams = getFA12ApproveParams(tokenContract, to, value);
  let resetApprove = false;
  try {
    await tezos.estimate.batch([approveParams]);
  } catch (err) {
    resetApprove = true;
  }

  return resetApprove
    ? [
        getFA12ApproveParams(tokenContract, to, new BigNumber(0)),
        approveParams,
        ...transfers,
      ]
    : [approveParams, ...transfers];
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
