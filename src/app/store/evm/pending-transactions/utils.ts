import type { RootState } from 'app/store/root-state.type';

import type { PendingEvmSwap, PendingEvmTransaction, PendingEvmTransfer } from './state';

export const selectAllPendingSwaps = (state: RootState): PendingEvmSwap[] => {
  return Object.values(state.pendingEvmTransactions?.swaps ?? {});
};

export const selectAllPendingTransfers = (state: RootState): PendingEvmTransfer[] => {
  return Object.values(state.pendingEvmTransactions?.transfers ?? {});
};

export const selectAllPendingTransactions = (state: RootState): PendingEvmTransaction[] => {
  return Object.values(state.pendingEvmTransactions?.otherTransactions ?? {});
};
