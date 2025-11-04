import type { RootState } from 'app/store/root-state.type';

import type { PendingEvmSwap } from './state';

export const selectAllPendingSwaps = (state: RootState): PendingEvmSwap[] => {
  return Object.values(state.pendingEvmSwaps?.swaps ?? {});
};
