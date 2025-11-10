import { createAction } from '@reduxjs/toolkit';

import { PendingEvmSwap, PendingEvmSwapBase } from './state';

type TxHash = HexString;

interface UpdateSwapStatusPayload {
  txHash: TxHash;
  status: 'DONE' | 'FAILED';
  lastCheckedAt: number;
}

export const addPendingEvmSwapAction = createAction<PendingEvmSwapBase>('evm/pending-transactions/ADD_SWAP');

export const updatePendingSwapStatusAction = createAction<UpdateSwapStatusPayload>(
  'evm/pending-transactions/UPDATE_SWAP_STATUS'
);

export const incrementSwapCheckAttemptsAction = createAction<TxHash>(
  'evm/pending-transactions/INCREMENT_SWAP_CHECK_ATTEMPTS'
);

export const updateBalancesAfterSwapAction = createAction<PendingEvmSwap>(
  'evm/pending-transactions/UPDATE_BALANCES_AFTER_SWAP'
);

export const removePendingEvmSwapAction = createAction<TxHash>('evm/pending-swaps/REMOVE_SWAP');

export const monitorPendingSwapsAction = createAction('evm/pending-transactions/MONITOR_SWAP');

export const cleanupOutdatedSwapsAction = createAction('evm/pending-transactions/CLEANUP_OUTDATED_SWAPS');
