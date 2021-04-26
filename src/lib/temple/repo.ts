import { OperationContentsAndResult } from "@taquito/rpc";
import Dexie from "dexie";

import { BcdTokenTransfer } from "lib/better-call-dev";
import { TzktOperation } from "lib/tzkt";

export enum Table {
  Operations = "operations",
  SyncTimes = "syncTimes",
}

export const db = new Dexie("TempleMain");
db.version(1).stores({
  [Table.Operations]: indexes(
    "&hash",
    "chainId",
    "*members",
    "*assetIds",
    "addedAt",
    "[chainId+addedAt]"
  ),
  [Table.SyncTimes]: indexes("[service+chainId+address]"),
});

export const waitFor = Dexie.waitFor;

export const operations = db.table<IOperation, string>(Table.Operations);
export const syncTimes = db.table<ISyncTime, string>(Table.SyncTimes);

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

export interface ISyncTime {
  service: "tzkt" | "bcd";
  chainId: string;
  address: string;
  higherTimestamp: number;
  lowerTimestamp: number;
}

function indexes(...items: string[]) {
  return items.join(",");
}

type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> &
  U[keyof U];
