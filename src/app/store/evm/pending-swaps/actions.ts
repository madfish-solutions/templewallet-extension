import { createAction } from '@reduxjs/toolkit';

import { EvmNetworkEssentials } from 'temple/networks';

import { PendingEvmSwap } from './state';

interface AddPendingSwapPayload {
  txHash: HexString;
  accountPkh: HexString;
  fromChainId: number;
  toChainId: number;
  bridge: string;
  inputTokenSlug: string;
  outputTokenSlug: string;
  outputNetwork: EvmNetworkEssentials;
  blockExplorerUrl: string;
}

interface UpdateSwapStatusPayload {
  txHash: HexString;
  status: 'DONE' | 'FAILED';
  lastCheckedAt: number;
}

interface EnsureOutputBalancePayload {
  swap: PendingEvmSwap;
}

interface IncrementCheckAttemptsPayload {
  txHash: HexString;
}

interface RemovePendingSwapPayload {
  txHash: HexString;
}

export const addPendingEvmSwapAction = createAction<AddPendingSwapPayload>('evm/pending-swaps/ADD');

export const updatePendingSwapStatusAction = createAction<UpdateSwapStatusPayload>('evm/pending-swaps/UPDATE_STATUS');

export const incrementSwapCheckAttemptsAction = createAction<IncrementCheckAttemptsPayload>(
  'evm/pending-swaps/INCREMENT_CHECK_ATTEMPTS'
);

export const ensureOutputBalanceAction = createAction<EnsureOutputBalancePayload>(
  'evm/pending-swaps/ENSURE_OUTPUT_BALANCE'
);

export const removePendingEvmSwapAction = createAction<RemovePendingSwapPayload>('evm/pending-swaps/REMOVE');

export const monitorPendingSwapsAction = createAction('evm/pending-swaps/MONITOR');

export const cleanupOutdatedSwapsAction = createAction('evm/pending-swaps/CLEANUP_OUTDATED');
