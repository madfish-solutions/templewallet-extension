import Dexie from "dexie";
import BigNumber from "bignumber.js";
import { OperationContentsAndResult, OpKind } from "@taquito/rpc";
import { BcdTokenTransfer, getTokenTransfers } from "lib/better-call-dev";
import { TzktOperation, getOperations } from "lib/tzkt";

export enum Table {
  Operations = "operations",
}

export const db = new Dexie("TempleMain");
db.version(1).stores({
  [Table.Operations]: indexes(
    "&hash",
    "chainId",
    "*members",
    "*assetIds",
    "addedAt"
  ),
});

export const operations = db.table<IOperation, string>(Table.Operations);

export interface IOperation {
  hash: string;
  chainId: string;
  members: string[];
  assetIds: string[];
  addedAt: number; // timestamp
  data: IOperationData;
}

export type IOperationData = AtLeastOne<{
  localGroup: OperationContentsAndResult[];
  tzktGroup: TzktOperation[];
  bcdTokenTransfers: BcdTokenTransfer[];
}>;

function indexes(...items: string[]) {
  return items.join(",");
}

type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> &
  U[keyof U];

export async function addLocalOperation(
  chainId: string,
  hash: string,
  localGroup: OperationContentsAndResult[]
) {
  const memberSet = new Set<string>();
  const assetIdSet = new Set<string>();

  for (const op of localGroup) {
    // Add sources to members
    switch (op.kind) {
      case OpKind.ACTIVATION:
        memberSet.add(op.pkh);
        break;

      case OpKind.PROPOSALS:
      case OpKind.BALLOT:
      case OpKind.REVEAL:
      case OpKind.TRANSACTION:
      case OpKind.DELEGATION:
      case OpKind.ORIGINATION:
        memberSet.add(op.source);
        break;
    }

    // Add targets to members
    switch (op.kind) {
      case OpKind.TRANSACTION:
        memberSet.add(op.destination);
        break;

      case OpKind.DELEGATION:
        op.delegate && memberSet.add(op.delegate);
        break;
    }

    // Parse asset ids
    if (op.kind === OpKind.ORIGINATION) {
      if (new BigNumber(op.balance).isPositive()) {
        assetIdSet.add("tez");
      }
    } else if (op.kind === OpKind.TRANSACTION) {
      if (new BigNumber(op.amount).isPositive()) {
        assetIdSet.add("tez");
      }

      if (op.parameters) {
        // Parse FA2 Transfer
        try {
          const { entrypoint, value } = op.parameters;
          if (entrypoint === "transfer") {
            for (const { args: x } of value as any) {
              if (typeof x[0].string === "string") {
                memberSet.add(x[0].string);
              }
              for (const { args: y } of x[1]) {
                if (typeof y[0].string === "string") {
                  memberSet.add(y[0].string);
                }
                if (typeof y[1].args[0].int === "string") {
                  assetIdSet.add(toTokenId(op.destination, y[1].args[0].int));
                }
              }
            }
          }
        } catch {}

        // Parse FA1.2 Transfer
        try {
          const { entrypoint, value } = op.parameters;
          if (entrypoint === "transfer") {
            const { args: x } = value as any;
            if (typeof x[0].string === "string") {
              memberSet.add(x[0].string);
            }
            const { args: y } = x[1];
            if (typeof y[0].string === "string") {
              memberSet.add(y[0].string);
            }
            if (typeof y[1].int === "string") {
              assetIdSet.add(toTokenId(op.destination));
            }
          }
        } catch {}
      }
    }
  }

  const members = Array.from(memberSet);
  const assetIds = Array.from(assetIdSet);

  return operations.add({
    hash,
    chainId,
    members,
    assetIds,
    addedAt: Date.now(),
    data: {
      localGroup,
    },
  });
}

export async function syncTzktOperations(chainId: string, address: string) {
  const operations = await getOperations(chainId as any, {
    address,
    from: new Date().toISOString(),
    to: new Date().toISOString(),
  });
}

function toTokenId(contractAddress: string, tokenId: string | number = 0) {
  return `${contractAddress}_${tokenId}`;
}
