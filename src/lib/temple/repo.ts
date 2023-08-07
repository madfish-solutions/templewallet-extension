import Dexie from 'dexie';

enum Table {
  AccountTokens = 'accountTokens',
  SyncTimes = 'syncTimes'
}

export const db = new Dexie('TempleMain');

db.version(1).stores({
  [Table.SyncTimes]: indexes('[service+chainId+address]')
});
db.version(2).stores({
  [Table.AccountTokens]: indexes('', '[chainId+account+type]', '[chainId+type]')
});
db.version(3).stores({
  [Table.AccountTokens]: indexes('', '[chainId+account]', '[chainId]')
});

export const accountTokens = db.table<IAccountToken, string>(Table.AccountTokens);

export function toAccountTokenKey(chainId: string, account: string, tokenSlug: string) {
  return [chainId, account, tokenSlug].join('_');
}

export enum ITokenStatus {
  Idle,
  Enabled,
  Disabled,
  Removed
}

export interface IAccountToken {
  chainId: string;
  account: string;
  tokenSlug: string;
  status: ITokenStatus;
  addedAt: number;
  latestBalance?: string;
}

function indexes(...items: string[]) {
  return items.join(',');
}
