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
  [Table.tezosActivities]: indexes(
    '++id',
    'oldestTzktOperation.timestamp',
    'oldestTzktOperation.level',
    'chainId',
    '&[hash+chainId]'
  ),
  [Table.tezosActivitiesIntervals]: indexes(
    '++id',
    'chainId',
    'fkNewestId',
    'fkOldestId',
    'newestTs',
    'newestLevel',
    'oldestTs',
    'oldestLevel'
  ),
  [Table.evmActivities]: indexes('++id', '[chainId+blockHeight]', '&[hash+chainId]'),
  [Table.evmActivitiesIntervals]: indexes('++id', '[chainId+account+oldestBlockHeight]'),
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

export interface EvmActivitiesInterval {
  chainId: number;
  newestBlockHeight: number;
  oldestBlockHeight: number;
  account: HexString;
}

/** Used to prevent typecasts for removing 'id' property and not specifying it when adding an entity */
interface EntityWithId {
  id?: number;
}

/** Use it only for tests */
export const tezosActivities = db.table<TezosActivity, number>(Table.tezosActivities);

/** Use it only for tests */
export const tezosActivitiesIntervals = db.table<TezosActivitiesInterval, number>(Table.tezosActivitiesIntervals);

export type DbEvmActivity = Omit<EvmActivity, 'operations' | 'blockHeight'> &
  EntityWithId & {
    operations: Array<Omit<EvmOperation, 'asset'> & { fkAsset?: number; amountSigned?: string | null }>;
    blockHeight: number;
    accounts: HexString[];
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
