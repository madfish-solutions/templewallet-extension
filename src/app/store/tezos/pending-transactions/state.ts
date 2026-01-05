import { TezosNetworkEssentials } from 'temple/networks';

export type TransactionStatus = 'PENDING' | 'DONE' | 'FAILED';

export interface TransactionState {
  submittedAt: number;
  lastCheckedAt: number;
  status: TransactionStatus;
  txHash: string;
  accountPkh: string;
  network: TezosNetworkEssentials;
  blockExplorerUrl: string;
  kind?: string;
}

export interface PendingTezosTransactionsState {
  transactions: StringRecord<TransactionState>;
  hashesByAccountChainId: StringRecord<string[]>;
}

export const pendingTezosTransactionsInitialState: PendingTezosTransactionsState = {
  transactions: {},
  hashesByAccountChainId: {}
};
