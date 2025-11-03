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
      id: payload.txHash,
      txHash: payload.txHash,
      accountPkh: payload.accountPkh,
      fromChainId: payload.fromChainId,
      toChainId: payload.toChainId,
      bridge: payload.bridge,
      inputTokenSlug: payload.inputTokenSlug,
      outputTokenSlug: payload.outputTokenSlug,
      outputNetworkChainId: payload.outputNetworkChainId,
      submittedAt: Date.now(),
      lastCheckedAt: Date.now(),
      checkAttempts: 0,
      balanceFetchAttempts: 0,
      status: 'pending'
    };
  });

  builder.addCase(updatePendingSwapStatusAction, (state, { payload }) => {
    const swap = state.swaps[payload.txHash];
    if (swap) {
      swap.status = payload.status;
      swap.lastCheckedAt = payload.lastCheckedAt;
    }
  });

  builder.addCase(incrementSwapCheckAttemptsAction, (state, { payload }) => {
    const swap = state.swaps[payload.txHash];
    if (swap) {
      swap.checkAttempts += 1;
      swap.lastCheckedAt = Date.now();
    }
  });

  builder.addCase(removePendingEvmSwapAction, (state, { payload }) => {
    delete state.swaps[payload.txHash];
  });
});

export const pendingEvmSwapsPersistedReducer = persistReducer<PendingEvmSwapsState>(
  {
    key: 'root.evm.pendingSwaps',
    ...storageConfig
  },
  pendingEvmSwapsReducer
);
