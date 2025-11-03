import type { RootState } from 'app/store/root-state.type';

import type { PendingEvmSwap } from './state';

export const selectAllPendingSwaps = (state: RootState): PendingEvmSwap[] => {
  return Object.values(state.pendingEvmSwaps?.swaps ?? {});
};

export const selectPendingSwapByTxHash = (state: RootState, txHash: HexString): PendingEvmSwap | undefined => {
  return state.pendingEvmSwaps?.swaps[txHash];
};

export const selectHasPendingSwaps = (state: RootState): boolean => {
  return selectAllPendingSwaps(state).length > 0;
};
