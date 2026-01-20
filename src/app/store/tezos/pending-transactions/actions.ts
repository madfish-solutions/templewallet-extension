import { createAction } from '@reduxjs/toolkit';

import { TransactionState } from './state';

export const addPendingTezosTransactionAction = createAction<Omit<TransactionState, 'lastCheckedAt' | 'status'>>(
  'tezos/pending-transactions/ADD_TRANSACTION'
);

export const updatePendingTezosTransactionStatusAction = createAction<
  Pick<TransactionState, 'txHash' | 'status' | 'lastCheckedAt'>
>('tezos/pending-transactions/UPDATE_TRANSACTION_STATUS');

export const removePendingTezosTransactionsAction = createAction<string[]>(
  'tezos/pending-transactions/REMOVE_TRANSACTION'
);

export const monitorPendingTezosTransactionsAction = createAction('tezos/pending-transactions/MONITOR_TRANSACTIONS');

export const cleanupOutdatedTezosPendingTxWithInitialMonitorTriggerAction = createAction(
  'tezos/pending-transactions/CLEANUP_OUTDATED_TEZOS_PENDING_TX_WITH_MONITOR_TRIGGER'
);

export const setTezosTransactionBeingWatchedAction = createAction<string | undefined>(
  'tezos/pending-transactions/SET_TRANSACTION_BEING_WATCHED'
);
