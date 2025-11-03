import { StatusMessage } from '@lifi/sdk';

import { EvmNetworkEssentials } from 'temple/networks';

export interface PendingEvmSwap {
  id: string; // txHash
  txHash: HexString;
  accountPkh: HexString;

  fromChainId: number;
  toChainId: number;
  bridge: string;

  inputTokenSlug: string;
  outputTokenSlug: string;
  outputNetwork: EvmNetworkEssentials;

  blockExplorerUrl: string;

  submittedAt: number;
  lastCheckedAt: number;
  checkAttempts: number;
  balanceFetchAttempts: number;

  status: StatusMessage;
}

export interface PendingEvmSwapsState {
  swaps: Record<string, PendingEvmSwap>; // keyed by txHash
}

export const pendingEvmSwapsInitialState: PendingEvmSwapsState = {
  swaps: {}
};
