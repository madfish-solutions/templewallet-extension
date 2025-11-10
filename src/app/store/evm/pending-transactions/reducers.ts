import { createReducer } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';

import { storageConfig } from 'lib/store';

import {
  addPendingEvmSwapAction,
  updatePendingSwapStatusAction,
  incrementSwapCheckAttemptsAction,
  removePendingEvmSwapAction
} from './actions';
import { pendingEvmSwapsInitialState, PendingEvmSwapsState } from './state';

const pendingEvmSwapsReducer = createReducer(pendingEvmSwapsInitialState, builder => {
  builder.addCase(addPendingEvmSwapAction, (state, { payload }) => {
    state.swaps[payload.txHash] = {
      ...payload,
      submittedAt: Date.now(),
      lastCheckedAt: Date.now(),
      statusCheckAttempts: 0,
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

  builder.addCase(removePendingEvmSwapAction, (state, { payload: txHash }) => {
    delete state.swaps[txHash];
  });
});

export const pendingEvmSwapsPersistedReducer = persistReducer<PendingEvmSwapsState>(
  {
    key: 'root.evm.pendingSwaps',
    ...storageConfig
  },
  pendingEvmSwapsReducer
);
