import { createEntity, LoadableEntityState } from 'lib/store';

/** 'idle' for disabled unless balance is positive */
export type StoredAssetStatus = 'idle' | 'enabled' | 'disabled' | 'removed';

export interface AccountAssetForStore {
  slug: string;
  chainId: string;
  /** PKH */
  account: string;
  status: StoredAssetStatus;
}

export interface StoredAsset {
  status: StoredAssetStatus;
  /** `true` if manually added by user */
  manual?: boolean;
}

type AccountAssetsRecord = StringRecord<StoredAsset>;
type StoredAssetsRecords = StringRecord<AccountAssetsRecord>;

export interface SliceState {
  tokens: LoadableEntityState<StoredAssetsRecords>;
  collectibles: LoadableEntityState<StoredAssetsRecords>;
  /** Mainnet tokens whitelist slugs */
  mainnetWhitelist: LoadableEntityState<string[]>;
  mainnetScamlist: LoadableEntityState<Record<string, boolean>>;
}

export const initialState: SliceState = {
  tokens: createEntity({}),
  collectibles: createEntity({}),
  mainnetWhitelist: createEntity([]),
  mainnetScamlist: createEntity({})
};
