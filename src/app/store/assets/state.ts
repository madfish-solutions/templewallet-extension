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

export type StoredToken = AccountAssetForStore;

export interface StoredCollectible {
  status: StoredAssetStatus;
  /** `true` if manually added by user */
  manual?: boolean;
}

type AccountCollectiblesRecord = StringRecord<StoredCollectible>;
type StoredCollectiblesRecords = StringRecord<AccountCollectiblesRecord>;

export interface SliceState {
  tokens: LoadableEntityState<StoredToken[]>;
  collectibles: LoadableEntityState<StoredCollectiblesRecords>;
  /** Mainnet tokens whitelist slugs */
  mainnetWhitelist: LoadableEntityState<string[]>;
}

export const initialState: SliceState = {
  tokens: createEntity([]),
  collectibles: createEntity({}),
  mainnetWhitelist: createEntity([])
};
