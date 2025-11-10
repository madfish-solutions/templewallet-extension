import type { RootState } from 'app/store/root-state.type';

import type { PendingEvmSwap, PendingEvmTransfer } from './state';

export const selectAllPendingSwaps = (state: RootState): PendingEvmSwap[] => {
  return Object.values(state.pendingEvmSwaps?.swaps ?? {});
};

export const selectAllPendingTransfers = (state: RootState): PendingEvmTransfer[] => {
  return Object.values(state.pendingEvmSwaps?.transfers ?? {});
};
