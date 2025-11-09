import { createAction } from '@reduxjs/toolkit';

import { PendingEvmSwap, PendingEvmSwapBase } from './state';

type TxHash = HexString;

interface UpdateSwapStatusPayload {
  txHash: TxHash;
  status: 'DONE' | 'FAILED';
  lastCheckedAt: number;
}

export const addPendingEvmSwapAction = createAction<PendingEvmSwapBase>('evm/pending-swaps/ADD');

export const updatePendingSwapStatusAction = createAction<UpdateSwapStatusPayload>('evm/pending-swaps/UPDATE_STATUS');

export const incrementSwapCheckAttemptsAction = createAction<TxHash>('evm/pending-swaps/INCREMENT_CHECK_ATTEMPTS');

export const updateBalancesAfterSwapAction = createAction<PendingEvmSwap>(
  'evm/pending-swaps/UPDATE_BALANCES_AFTER_SWAP'
);

export const removePendingEvmSwapAction = createAction<TxHash>('evm/pending-swaps/REMOVE');

export const monitorPendingSwapsAction = createAction('evm/pending-swaps/MONITOR');

export const cleanupOutdatedSwapsAction = createAction('evm/pending-swaps/CLEANUP_OUTDATED');
