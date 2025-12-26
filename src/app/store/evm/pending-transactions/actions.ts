import { createAction } from '@reduxjs/toolkit';

import {
  MonitorStatesBase,
  PendingEvmSwap,
  PendingEvmSwapBase,
  PendingEvmTransactionBase,
  PendingEvmTransfer,
  PendingEvmTransferBase
} from './state';

type TxHash = HexString;

interface UpdateStatusPayload {
  txHash: TxHash;
  status: 'DONE' | 'FAILED';
  lastCheckedAt: number;
}

export const addPendingEvmSwapAction = createAction<PendingEvmSwapBase & MonitorStatesBase>(
  'evm/pending-transactions/ADD_SWAP'
);

export const updatePendingSwapStatusAction = createAction<UpdateStatusPayload>(
  'evm/pending-transactions/UPDATE_SWAP_STATUS'
);

export const incrementSwapCheckAttemptsAction = createAction<TxHash>(
  'evm/pending-transactions/INCREMENT_SWAP_CHECK_ATTEMPTS'
);

export const disableSwapCheckStatusRetriesAction = createAction<TxHash>(
  'evm/pending-transactions/SWAP_DISABLE_RETRIES'
);

export const updateBalancesAfterSwapAction = createAction<PendingEvmSwap>(
  'evm/pending-transactions/UPDATE_BALANCES_AFTER_SWAP'
);

export const removePendingEvmSwapAction = createAction<TxHash>('evm/pending-swaps/REMOVE_SWAP');

export const monitorPendingSwapsAction = createAction('evm/pending-transactions/MONITOR_SWAP');

export const cleanupOutdatedEvmPendingTxWithInitialMonitorTriggerAction = createAction(
  'evm/pending-transactions/CLEANUP_OUTDATED_EVM_PENDING_TX_WITH_MONITOR_TRIGGER'
);

export const addPendingEvmTransferAction = createAction<PendingEvmTransferBase & MonitorStatesBase>(
  'evm/pending-transactions/ADD_TRANSFER'
);

export const updatePendingTransferStatusAction = createAction<UpdateStatusPayload>(
  'evm/pending-transactions/UPDATE_TRANSFER_STATUS'
);

export const updateBalancesAfterTransferAction = createAction<PendingEvmTransfer>(
  'evm/pending-transactions/UPDATE_BALANCES_AFTER_TRANSFER'
);

export const removePendingEvmTransferAction = createAction<TxHash>('evm/pending-transactions/REMOVE_TRANSFER');

export const monitorPendingTransfersAction = createAction('evm/pending-transactions/MONITOR_TRANSFER');

export const addPendingEvmOtherTransactionAction = createAction<PendingEvmTransactionBase & MonitorStatesBase>(
  'evm/pending-transactions/ADD_OTHER_TRANSACTION'
);

export const updatePendingOtherTransactionStatusAction = createAction<UpdateStatusPayload>(
  'evm/pending-transactions/UPDATE_OTHER_TRANSACTION_STATUS'
);

export const removePendingEvmOtherTransactionAction = createAction<TxHash>(
  'evm/pending-transactions/REMOVE_OTHER_TRANSACTION'
);

export const monitorPendingOtherTransactionsAction = createAction('evm/pending-transactions/MONITOR_OTHER_TRANSACTION');
