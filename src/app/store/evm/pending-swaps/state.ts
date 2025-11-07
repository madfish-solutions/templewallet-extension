import { StatusMessage, GetStatusRequest } from '@lifi/sdk';

import { EvmNetworkEssentials } from 'temple/networks';

export interface PendingEvmSwapBase {
  txHash: HexString;
  accountPkh: HexString;
  initialInputTokenSlug: string;
  initialInputNetwork: EvmNetworkEssentials;
  outputTokenSlug: string;
  outputNetwork: EvmNetworkEssentials;
  blockExplorerUrl: string;
  statusCheckParams: Omit<GetStatusRequest, 'txHash'>;
}

export interface PendingEvmSwap extends PendingEvmSwapBase {
  id: string; // txHash
  submittedAt: number;
  lastCheckedAt: number;
  statusCheckAttempts: number;
  balanceFetchAttempts: number;
  status: StatusMessage;
}

export interface PendingEvmSwapsState {
  swaps: Record<string, PendingEvmSwap>; // keyed by txHash
}

export const pendingEvmSwapsInitialState: PendingEvmSwapsState = {
  swaps: {}
};
