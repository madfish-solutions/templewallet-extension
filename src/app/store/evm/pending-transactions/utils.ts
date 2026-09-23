import type { RootState } from 'app/store/root-state.type';

import type { PendingEvmBatch, PendingEvmSwap, PendingEvmTransaction, PendingEvmTransfer } from './state';

export const selectAllPendingBatches = (state: RootState): PendingEvmBatch[] =>
  Object.values(state.pendingEvmTransactions?.batches ?? {});

export const hasPendingEvmBatch = (
  state: RootState,
  accountPkh: HexString,
  chainId: number,
  batchKey: string
): boolean =>
  selectAllPendingBatches(state).some(
    batch => batch.accountPkh === accountPkh && batch.inputNetwork.chainId === chainId && batch.batchKey === batchKey
  ) ||
  selectAllPendingSwaps(state).some(
    swap => swap.accountPkh === accountPkh && swap.initialInputNetwork.chainId === chainId && swap.batchKey === batchKey
  );

export const selectAllPendingSwaps = (state: RootState): PendingEvmSwap[] => {
  return Object.values(state.pendingEvmTransactions?.swaps ?? {});
};

export const selectAllPendingTransfers = (state: RootState): PendingEvmTransfer[] => {
  return Object.values(state.pendingEvmTransactions?.transfers ?? {});
};

export const selectAllPendingOtherTransactions = (state: RootState): PendingEvmTransaction[] => {
  return Object.values(state.pendingEvmTransactions?.otherTransactions ?? {});
};
