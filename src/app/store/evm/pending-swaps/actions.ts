import { createAction } from '@reduxjs/toolkit';

import { createActions } from 'lib/store';
import { EvmNetworkEssentials } from 'temple/networks';

import { PendingEvmSwap } from './state';

export interface AddPendingSwapPayload {
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

export interface UpdateSwapStatusPayload {
  txHash: HexString;
  status: 'DONE' | 'FAILED';
  lastCheckedAt: number;
}

export interface EnsureOutputBalancePayload {
  swap: PendingEvmSwap;
}

export interface IncrementCheckAttemptsPayload {
  txHash: HexString;
}

export interface RemovePendingSwapPayload {
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

export const checkSwapStatusActions = createActions<{ txHash: HexString }, { txHash: HexString; status: string }>(
  'evm/pending-swaps/CHECK_STATUS'
);
