import { StatusMessage, GetStatusRequest } from '@lifi/sdk';

import { EvmNetworkEssentials } from 'temple/networks';

type TxHash = HexString;

export interface MonitorStatesBase {
  submittedAt: number;
}

interface MonitorStates extends MonitorStatesBase {
  lastCheckedAt: number;
  status: StatusMessage;
}

interface Common {
  txHash: TxHash;
  accountPkh: HexString;
  blockExplorerUrl: string;
}

export interface PendingEvmSwapBase extends Common {
  initialInputTokenSlug: string;
  initialInputNetwork: EvmNetworkEssentials;
  outputTokenSlug: string;
  outputNetwork: EvmNetworkEssentials;
  statusCheckParams: Omit<GetStatusRequest, 'txHash'> & { provider?: 'lifi' | '3route' };
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
  transfers: Record<TxHash, PendingEvmTransfer>;
  swaps: Record<TxHash, PendingEvmSwap>;
  otherTransactions: Record<TxHash, PendingEvmTransaction>;
}

export const pendingEvmTransactionsInitialState: PendingEvmTransactionsState = {
  transfers: {},
  swaps: {},
  otherTransactions: {}
};
