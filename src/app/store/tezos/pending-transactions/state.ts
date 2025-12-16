import { TezosNetworkEssentials } from 'temple/networks';

export interface TransactionState {
  submittedAt: number;
  lastCheckedAt: number;
  status: 'PENDING' | 'DONE' | 'FAILED';
  txHash: string;
  accountPkh: string;
  network: TezosNetworkEssentials;
  blockExplorerUrl: string;
}

export interface PendingTezosTransactionsState {
  transactions: StringRecord<TransactionState>;
  hashesByAccountChainId: StringRecord<string[]>;
}

export const pendingTezosTransactionsInitialState: PendingTezosTransactionsState = {
  transactions: {},
  hashesByAccountChainId: {}
};
