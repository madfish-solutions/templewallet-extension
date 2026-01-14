import { createReducer } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';

import { storageConfig } from 'lib/store';

import {
  addPendingEvmSwapAction,
  updatePendingSwapStatusAction,
  incrementSwapCheckAttemptsAction,
  removePendingEvmSwapAction,
  addPendingEvmTransferAction,
  updatePendingTransferStatusAction,
  removePendingEvmTransferAction,
  disableSwapCheckStatusRetriesAction,
  addPendingEvmOtherTransactionAction,
  updatePendingOtherTransactionStatusAction,
  removePendingEvmOtherTransactionAction,
  setEvmTransferBeingWatchedAction
} from './actions';
import { pendingEvmTransactionsInitialState, PendingEvmTransactionsState } from './state';

const pendingEvmTransactionsReducer = createReducer(pendingEvmTransactionsInitialState, builder => {
  builder.addCase(addPendingEvmSwapAction, (state, { payload }) => {
    state.swaps[payload.txHash] = {
      ...payload,
      lastCheckedAt: payload.submittedAt,
      statusCheckAttempts: 0,
      retriesEnabled: true,
      status: 'PENDING'
    };
  });

  builder.addCase(updatePendingSwapStatusAction, (state, { payload }) => {
    const swap = state.swaps[payload.txHash];
    if (swap) {
      swap.status = payload.status;
      swap.lastCheckedAt = payload.lastCheckedAt;
    }
  });

  builder.addCase(incrementSwapCheckAttemptsAction, (state, { payload: txHash }) => {
    const swap = state.swaps[txHash];
    if (swap) {
      swap.statusCheckAttempts += 1;
      swap.lastCheckedAt = Date.now();
    }
  });

  builder.addCase(disableSwapCheckStatusRetriesAction, (state, { payload: txHash }) => {
    const swap = state.swaps[txHash];
    if (swap) {
      swap.retriesEnabled = false;
    }
  });

  builder.addCase(removePendingEvmSwapAction, (state, { payload: txHash }) => {
    delete state.swaps[txHash];
  });

  builder.addCase(addPendingEvmTransferAction, (state, { payload }) => {
    state.transfers[payload.txHash] = {
      ...payload,
      lastCheckedAt: payload.submittedAt,
      status: 'PENDING'
    };
  });

  builder.addCase(updatePendingTransferStatusAction, (state, { payload }) => {
    const transfer = state.transfers[payload.txHash];
    if (transfer) {
      transfer.status = payload.status;
      transfer.lastCheckedAt = payload.lastCheckedAt;
    }
  });

  builder.addCase(removePendingEvmTransferAction, (state, { payload: txHash }) => {
    delete state.transfers[txHash];
  });

  builder.addCase(addPendingEvmOtherTransactionAction, (state, { payload }) => {
    state.otherTransactions[payload.txHash] = {
      ...payload,
      lastCheckedAt: payload.submittedAt,
      status: 'PENDING'
    };
  });

  builder.addCase(updatePendingOtherTransactionStatusAction, (state, { payload }) => {
    const transaction = state.otherTransactions[payload.txHash];
    if (transaction) {
      transaction.status = payload.status;
      transaction.lastCheckedAt = payload.lastCheckedAt;
    }
  });

  builder.addCase(removePendingEvmOtherTransactionAction, (state, { payload: txHash }) => {
    delete state.otherTransactions[txHash];
  });

  builder.addCase(setEvmTransferBeingWatchedAction, (state, { payload: txHash }) => {
    state.transferBeingWatched = txHash;
  });
});

export const pendingEvmTransactionsPersistedReducer = persistReducer<PendingEvmTransactionsState>(
  {
    key: 'root.evm.pendingTransactions',
    ...storageConfig,
    blacklist: ['transferBeingWatched']
  },
  pendingEvmTransactionsReducer
);
