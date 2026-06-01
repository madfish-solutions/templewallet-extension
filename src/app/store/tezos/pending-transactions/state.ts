import { TezosNetworkEssentials } from 'temple/networks';
import { PendingTransactionStatus } from 'temple/types';

export interface TransactionState {
  submittedAt: number;
  lastCheckedAt: number;
  status: PendingTransactionStatus;
  txHash: string;
  accountPkh: string;
  network: TezosNetworkEssentials;
  blockExplorerUrl: string;
  kind?: string;
  /** When true, the pending-tx watcher skips the success/failure toasts for this entry. */
  silent?: boolean;
}

export interface PendingTezosTransactionsState {
  transactions: StringRecord<TransactionState>;
  hashesByAccountChainId: StringRecord<string[]>;
  transactionBeingWatched?: string;
}

export const pendingTezosTransactionsInitialState: PendingTezosTransactionsState = {
  transactions: {},
  hashesByAccountChainId: {}
};
