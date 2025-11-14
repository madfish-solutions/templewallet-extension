import { StatusMessage, GetStatusRequest } from '@lifi/sdk';

import { EvmNetworkEssentials } from 'temple/networks';

type TxHash = HexString;

interface MonitorStates {
  submittedAt: number;
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
  statusCheckParams: Omit<GetStatusRequest, 'txHash'>;
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

export interface PendingEvmTransactionsState {
  transfers: Record<TxHash, PendingEvmTransfer>;
  swaps: Record<TxHash, PendingEvmSwap>;
}

export const pendingEvmTransactionsInitialState: PendingEvmTransactionsState = {
  transfers: {},
  swaps: {}
};
