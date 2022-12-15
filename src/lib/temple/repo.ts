import { OperationContentsAndResult } from '@taquito/rpc';
import Dexie from 'dexie';

import { TzktOperation, TzktTokenTransfer } from 'lib/apis/tzkt';

enum Table {
  AccountTokens = 'accountTokens',
  Operations = 'operations',
  SyncTimes = 'syncTimes'
}

export const db = new Dexie('TempleMain');
db.version(1).stores({
  [Table.Operations]: indexes('&hash', 'chainId', '*members', '*assetIds', 'addedAt', '[chainId+addedAt]'),
  [Table.SyncTimes]: indexes('[service+chainId+address]')
});
db.version(2).stores({
  [Table.AccountTokens]: indexes('', '[chainId+account+type]', '[chainId+type]')
});

export const accountTokens = db.table<IAccountToken, string>(Table.AccountTokens);
export const operations = db.table<IOperation, string>(Table.Operations);

export function toAccountTokenKey(chainId: string, account: string, tokenSlug: string) {
  return [chainId, account, tokenSlug].join('_');
}

export enum ITokenType {
  Fungible,
  Collectible
}

export enum ITokenStatus {
  Idle,
  Enabled,
  Disabled,
  Removed
}

export interface IAccountToken {
  type: ITokenType;
  chainId: string;
  account: string;
  tokenSlug: string;
  status: ITokenStatus;
  addedAt: number;
  latestBalance?: string;
  latestUSDBalance?: string;
}

interface IOperation {
  hash: string;
  chainId: string;
  members: Array<string>;
  assetIds: Array<string>;
  addedAt: number; // timestamp
  data: IOperationData;
}

type IOperationData = AtLeastOne<{
  localGroup: Array<OperationContentsAndResult>;
  tzktGroup: Array<TzktOperation>;
  tzktTokenTransfers: Array<TzktTokenTransfer>;
}>;

function indexes(...items: string[]) {
  return items.join(',');
}

type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U];
