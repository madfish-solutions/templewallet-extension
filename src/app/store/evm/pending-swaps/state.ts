import { StatusMessage } from '@lifi/sdk';

import { EvmNetworkEssentials } from 'temple/networks';

export interface PendingEvmSwapBase {
  txHash: HexString;
  accountPkh: HexString;
  inputTokenSlug: string;
  outputTokenSlug: string;
  inputNetwork: EvmNetworkEssentials;
  outputNetwork: EvmNetworkEssentials;
  blockExplorerUrl: string;
  bridge: string;
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
