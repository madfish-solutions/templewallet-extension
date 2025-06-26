import Dexie from 'dexie';

import { EvmActivity, EvmActivityAsset, EvmOperation, TezosActivity } from 'lib/activity';
import { TezosActivityOlderThan } from 'lib/activity/tezos/types';

enum Table {
  tezosActivities = 'tezosActivities',
  tezosActivitiesIntervals = 'tezosActivitiesIntervals',
  evmActivities = 'evmActivities',
  evmActivitiesIntervals = 'evmActivitiesIntervals',
  evmActivityAssets = 'evmAssets'
}

export const db = new Dexie('TempleActivity', { autoOpen: true });

Dexie.debug = true;

export const NO_TOKEN_ID_VALUE = '-1';

const v1Stores = {
  [Table.tezosActivities]: indexes(
    '++id',
    'account',
    '[chainId+account+hash]',
    '[chainId+account+oldestTzktOperation.timestamp]',
    '[chainId+account+assetSlug+oldestTzktOperation.timestamp]'
  ),
  [Table.tezosActivitiesIntervals]: indexes(
    '++id',
    'account',
    '[chainId+account+lowerLimit.oldestTzktOperation.timestamp]',
    '[chainId+account+upperLimit.oldestTzktOperation.timestamp]',
    '[chainId+account+assetSlug+lowerLimit.oldestTzktOperation.timestamp]',
    '[chainId+account+assetSlug+upperLimit.oldestTzktOperation.timestamp]'
  ),
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
};
db.version(1).stores(v1Stores);
db.version(2)
  .stores({
    ...v1Stores,
    [Table.evmActivities]: indexes(
      '++id',
      'account',
      '[chainId+account+hash]',
      '[chainId+account+blockHeight]',
      '[chainId+account+contract+blockHeight]'
    )
  })
  .upgrade(tx =>
    tx
      .table<DbEvmActivity>(Table.evmActivities)
      .toCollection()
      .modify(activity => {
        activity.index = null;
        activity.fee = null;
        activity.value = null;
      })
  );

export interface TezosActivitiesInterval extends EntityWithId {
  chainId: string;
  /** Not inclusive */
  upperLimit: TezosActivityOlderThan;
  lowerLimit: TezosActivityOlderThan;
  account: string;
  assetSlug: string;
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

export type DbTezosActivity = TezosActivity & EntityWithId & { account: string; assetSlug: string };

export const tezosActivities = db.table<DbTezosActivity, number>(Table.tezosActivities);

export const tezosActivitiesIntervals = db.table<TezosActivitiesInterval & EntityWithId, number>(
  Table.tezosActivitiesIntervals
);

export type DbEvmActivity = Omit<EvmActivity, 'operations' | 'blockHeight'> &
  EntityWithId & {
    operations: Array<Omit<EvmOperation, 'asset'> & { fkAsset?: number; amountSigned?: string | null }>;
    blockHeight: number;
    account: HexString;
    contract: string;
  };

export type DbEvmActivityAsset = Omit<EvmActivityAsset, 'amountSigned'> &
  EntityWithId & { chainId: number; tokenId: string };

export const evmActivities = db.table<DbEvmActivity, number>(Table.evmActivities);

export const evmActivitiesIntervals = db.table<EvmActivitiesInterval, number>(Table.evmActivitiesIntervals);

export const evmActivityAssets = db.table<DbEvmActivityAsset, number>(Table.evmActivityAssets);

function indexes(...items: string[]) {
  return items.join(',');
}
