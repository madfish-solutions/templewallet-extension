import Dexie from 'dexie';

import { EvmActivity, EvmActivityAsset, EvmOperation, TezosActivity } from 'lib/activity';

enum Table {
  tezosActivities = 'tezosActivities',
  tezosActivitiesIntervals = 'tezosActivitiesIntervals',
  evmActivities = 'evmActivities',
  evmActivitiesToAccounts = 'evmActivitiesToAccounts',
  evmActivitiesIntervals = 'evmActivitiesIntervals',
  evmActivityAssets = 'evmAssets'
}

export const db = new Dexie('TempleActivity', { autoOpen: true });

Dexie.debug = true;

export const NO_TOKEN_ID_VALUE = '-1';

db.version(1).stores({
  [Table.tezosActivities]: indexes('++id'),
  [Table.tezosActivitiesIntervals]: indexes('++id'),
  [Table.evmActivities]: indexes(
    '++id',
    'account',
    '[chainId+account+blockHeight]',
    '[chainId+account+contract+blockHeight]'
  ),
  [Table.evmActivitiesIntervals]: indexes(
    '++id',
    'account',
    '[chainId+account+oldestBlockHeight]',
    '[chainId+account+newestBlockHeight]',
    '[chainId+account+contract+oldestBlockHeight]',
    '[chainId+account+contract+newestBlockHeight]'
  ),
  [Table.evmActivityAssets]: indexes('++id', '&[chainId+contract+tokenId]')
});

interface TezosActivitiesInterval {
  chainId: string;
  fkNewestId: number;
  fkOldestId: number;
  newestTs: string;
  newestLevel: number;
  oldestTs: string;
  oldestLevel: number;
}

/** Used to prevent typecasts for removing 'id' property and not specifying it when adding an entity */
interface EntityWithId {
  id?: number;
}

export interface EvmActivitiesInterval extends EntityWithId {
  chainId: number;
  newestBlockHeight: number;
  oldestBlockHeight: number;
  account: HexString;
  contract: string;
}

/** Use it only for tests */
export const tezosActivities = db.table<TezosActivity, number>(Table.tezosActivities);

/** Use it only for tests */
export const tezosActivitiesIntervals = db.table<TezosActivitiesInterval, number>(Table.tezosActivitiesIntervals);

export type DbEvmActivity = Omit<EvmActivity, 'operations' | 'blockHeight'> &
  EntityWithId & {
    operations: Array<Omit<EvmOperation, 'asset'> & { fkAsset?: number; amountSigned?: string | null }>;
    blockHeight: number;
    account: HexString;
    contract: string;
  };

export type DbEvmActivityAsset = Omit<EvmActivityAsset, 'amountSigned'> &
  EntityWithId & { chainId: number; tokenId: string };

/** Use it only for tests */
export const evmActivities = db.table<DbEvmActivity, number>(Table.evmActivities);

/** Use it only for tests */
export const evmActivitiesIntervals = db.table<EvmActivitiesInterval, number>(Table.evmActivitiesIntervals);

/** Use it only for tests */
export const evmActivityAssets = db.table<DbEvmActivityAsset, number>(Table.evmActivityAssets);

function indexes(...items: string[]) {
  return items.join(',');
}
