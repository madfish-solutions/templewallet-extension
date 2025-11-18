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
  disableSwapCheckStatusRetriesAction
} from './actions';
import { pendingEvmTransactionsInitialState, PendingEvmTransactionsState } from './state';

const pendingEvmTransactionsReducer = createReducer(pendingEvmTransactionsInitialState, builder => {
  builder.addCase(addPendingEvmSwapAction, (state, { payload }) => {
    state.swaps[payload.txHash] = {
      ...payload,
      submittedAt: Date.now(),
      lastCheckedAt: Date.now(),
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
      submittedAt: Date.now(),
      lastCheckedAt: Date.now(),
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
});

export const pendingEvmTransactionsPersistedReducer = persistReducer<PendingEvmTransactionsState>(
  {
    key: 'root.evm.pendingTransactions',
    ...storageConfig
  },
  pendingEvmTransactionsReducer
);
