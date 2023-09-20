import { createEntity, LoadableEntityState } from 'lib/store';

type NumberString = `${bigint}`;

interface TokenBase {
  std: 'fa-1.2' | 'fa-2';
  address: string;
  /** Whole number {0, 1, 2, 3, ...} */
  id?: string;
  /** Whole number {0, 1, 2, 3, ...} */
  decimals: number;
  symbol: string;
  name: string;
}

export type StoredAssetStatus = 'enabled' | 'disabled' | 'removed';

export interface StoredToken {
  slug: string;
  chainId: string;
  /** PKH */
  account: string;
  /** Absent for 'idle' (disabled unless balance is positive) state */
  status?: StoredAssetStatus;
}

export interface SliceState {
  tokens: LoadableEntityState<StoredToken[]>;
  /** Mainnet tokens whitelist slugs */
  mainnetWhitelist: LoadableEntityState<string[]>;
}

export const initialState: SliceState = {
  tokens: createEntity([]),
  mainnetWhitelist: createEntity([])
};
