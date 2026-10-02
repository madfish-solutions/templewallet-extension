import { GetStatusRequest } from '@lifi/sdk';

import { EvmNetworkEssentials } from 'temple/networks';
import { PendingTransactionStatus } from 'temple/types';

type TxHash = HexString;

export interface MonitorStatesBase {
  submittedAt: number;
}

interface MonitorStates extends MonitorStatesBase {
  lastCheckedAt: number;
  status: PendingTransactionStatus;
}

interface Common {
  txHash: TxHash;
  accountPkh: HexString;
  blockExplorerUrl: string;
  /** When true, the pending-tx watcher skips the success/failure toasts for this entry. */
  silent?: boolean;
}

export interface PendingEvmSwapBase extends Common {
  batchKey?: string;
  initialInputTokenSlug: string;
  initialInputNetwork: EvmNetworkEssentials;
  outputTokenSlug: string;
  outputNetwork: EvmNetworkEssentials;
  statusCheckParams: Omit<GetStatusRequest, 'txHash'> & { provider?: 'lifi' | '3route' };
}

export interface PendingEvmBatch
  extends MonitorStatesBase, Omit<PendingEvmSwapBase, 'txHash' | 'blockExplorerUrl' | 'batchKey'> {
  callId: HexString;
  batchKey: string;
  inputNetwork: EvmNetworkEssentials;
  blockExplorerBaseUrl: string;
}

export interface PendingEvmTransactionBase extends Common {
  network: EvmNetworkEssentials;
}

export interface PendingEvmTransferBase extends Common {
  assetSlug: string;
  network: EvmNetworkEssentials;
}

export type PendingEvmSwap = PendingEvmSwapBase &
  MonitorStates & {
    statusCheckAttempts: number;
    retriesEnabled: boolean;
  };
export type PendingEvmTransfer = PendingEvmTransferBase & MonitorStates;
export type PendingEvmTransaction = PendingEvmTransactionBase & MonitorStates;

export interface PendingEvmTransactionsState {
  batches: Record<HexString, PendingEvmBatch>;
  transfers: Record<TxHash, PendingEvmTransfer>;
  swaps: Record<TxHash, PendingEvmSwap>;
  otherTransactions: Record<TxHash, PendingEvmTransaction>;
  transferBeingWatched?: TxHash;
}

export const pendingEvmTransactionsInitialState: PendingEvmTransactionsState = {
  batches: {},
  transfers: {},
  swaps: {},
  otherTransactions: {}
};
