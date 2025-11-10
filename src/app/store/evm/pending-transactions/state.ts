import { StatusMessage, GetStatusRequest } from '@lifi/sdk';

import { EvmNetworkEssentials } from 'temple/networks';

type TxHash = HexString;

export interface PendingEvmSwapBase {
  txHash: TxHash;
  accountPkh: HexString;
  initialInputTokenSlug: string;
  initialInputNetwork: EvmNetworkEssentials;
  outputTokenSlug: string;
  outputNetwork: EvmNetworkEssentials;
  blockExplorerUrl: string;
  statusCheckParams: Omit<GetStatusRequest, 'txHash'>;
}

export interface PendingEvmSwap extends PendingEvmSwapBase {
  submittedAt: number;
  lastCheckedAt: number;
  statusCheckAttempts: number;
  status: StatusMessage;
}

export interface PendingEvmSwapsState {
  swaps: Record<TxHash, PendingEvmSwap>;
}

export const pendingEvmSwapsInitialState: PendingEvmSwapsState = {
  swaps: {}
};
