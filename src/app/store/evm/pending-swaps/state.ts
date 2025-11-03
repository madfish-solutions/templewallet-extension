export interface PendingEvmSwap {
  id: string; // txHash
  txHash: HexString;
  accountPkh: HexString;

  fromChainId: number;
  toChainId: number;
  bridge: string;

  inputTokenSlug: string;
  outputTokenSlug: string;
  outputNetworkChainId: number;

  submittedAt: number;
  lastCheckedAt: number;
  checkAttempts: number;
  balanceFetchAttempts: number;

  status: 'pending' | 'done' | 'failed' | 'balance_confirmed';
}

export interface PendingEvmSwapsState {
  swaps: Record<string, PendingEvmSwap>; // keyed by txHash
}

export const pendingEvmSwapsInitialState: PendingEvmSwapsState = {
  swaps: {}
};
