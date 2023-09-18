import { createEntity, LoadableEntityState } from 'lib/store';

// type NumberString = `${bigint}`;

// interface TokenBase {
//   std: 'fa-1.2' | 'fa-2';
//   address: string;
//   /** Whole number {0, 1, 2, 3, ...} */
//   id?: string;
//   /** Whole number {0, 1, 2, 3, ...} */
//   decimals: number;
//   symbol: string;
//   name: string;
// }

export type StorredAssetStatus = 'enabled' | 'disabled' | 'removed';

export interface StorredToken {
  slug: string;
  // std: 'fa-2' | 'fa-1.2';
  chainId: string;
  /** PKH */
  account: string;
  /** Absent for 'idle' (disabled unless balance is positive) state */
  status?: StorredAssetStatus;
}

export interface SliceState {
  tokens: LoadableEntityState<StorredToken[]>;
}

export const initialState: SliceState = {
  tokens: createEntity([])
};
