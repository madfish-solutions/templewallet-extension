import { createEntity, LoadableEntityState } from 'lib/store';

export type StoredAssetStatus = 'enabled' | 'disabled' | 'removed';

interface WithAssetStatus {
  /** Absent for 'idle' (disabled unless balance is positive) state */
  status?: StoredAssetStatus;
}

export interface StoredAsset extends WithAssetStatus {
  slug: string;
  chainId: string;
  /** PKH */
  account: string;
}

export type StoredToken = StoredAsset;

export type StoredCollectible = StoredAsset;

type AccountCollectiblesRecord = StringRecord<WithAssetStatus>;
type StoredCollectiblesRecords = StringRecord<AccountCollectiblesRecord>;

export interface SliceState {
  tokens: LoadableEntityState<StoredAsset[]>;
  collectibles: LoadableEntityState<StoredCollectiblesRecords>;
  /** Mainnet tokens whitelist slugs */
  mainnetWhitelist: LoadableEntityState<string[]>;
}

export const initialState: SliceState = {
  tokens: createEntity([]),
  collectibles: createEntity({}),
  mainnetWhitelist: createEntity([])
};
