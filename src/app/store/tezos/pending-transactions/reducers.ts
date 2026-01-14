import { createReducer } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';

import { storageConfig } from 'lib/store';

import {
  addPendingTezosTransactionAction,
  removePendingTezosTransactionsAction,
  setTezosTransactionBeingWatchedAction,
  updatePendingTezosTransactionStatusAction
} from './actions';
import { PendingTezosTransactionsState, pendingTezosTransactionsInitialState } from './state';
import { toAccountChainIdSlug } from './utils';

const pendingTezosTransactionsReducer = createReducer(pendingTezosTransactionsInitialState, builder => {
  builder.addCase(addPendingTezosTransactionAction, (state, { payload }) => {
    state.transactions[payload.txHash] = {
      ...payload,
      lastCheckedAt: payload.submittedAt,
      status: 'PENDING'
    };

    const accountChainIdSlug = toAccountChainIdSlug(payload.accountPkh, payload.network.chainId);
    if (!state.hashesByAccountChainId[accountChainIdSlug]) {
      state.hashesByAccountChainId[accountChainIdSlug] = [];
    }

    state.hashesByAccountChainId[accountChainIdSlug].push(payload.txHash);
  });

  builder.addCase(updatePendingTezosTransactionStatusAction, (state, { payload }) => {
    const { txHash, status, lastCheckedAt } = payload;
    const transaction = state.transactions[txHash];
    if (transaction) {
      transaction.status = status;
      transaction.lastCheckedAt = lastCheckedAt;
    }
  });

  builder.addCase(removePendingTezosTransactionsAction, (state, { payload: txHashes }) => {
    txHashes.forEach(txHash => {
      const tx = state.transactions[txHash];
      if (tx) {
        const accountChainIdSlug = toAccountChainIdSlug(tx.accountPkh, tx.network.chainId);
        delete state.transactions[txHash];
        state.hashesByAccountChainId[accountChainIdSlug] = state.hashesByAccountChainId[accountChainIdSlug].filter(
          hash => hash !== txHash
        );
      }
    });
  });

  builder.addCase(setTezosTransactionBeingWatchedAction, (state, { payload: txHash }) => {
    state.transactionBeingWatched = txHash;
  });
});

export const pendingTezosTransactionsPersistedReducer = persistReducer<PendingTezosTransactionsState>(
  {
    key: 'root.tezos.pendingTransactions',
    ...storageConfig,
    blacklist: ['transactionBeingWatched']
  },
  pendingTezosTransactionsReducer
);
