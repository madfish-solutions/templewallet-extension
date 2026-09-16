import memoizee from 'memoizee';

import { BAKING_STAKE_SYNC_INTERVAL } from 'lib/fixed-times';
import { MAX_MEMOIZED_TOOLKITS } from 'temple/misc';
import { TezosNetworkEssentials } from 'temple/networks';

import { getTezosRpcClient } from './rpc-client';

const FALLBACK_BLOCK_DURATION_MS = 6_000;
const MIN_CONFIRMATION_TIMEOUT_MS = 30_000;
const CONFIRMATION_TIMEOUT_BLOCKS = 3;

interface TezosNetworkTiming {
  blockDurationMs: number;
  confirmationTimeoutMs: number;
}

const makeTezosNetworkTiming = (blockDurationMs: number): TezosNetworkTiming => ({
  blockDurationMs,
  confirmationTimeoutMs: Math.max(CONFIRMATION_TIMEOUT_BLOCKS * blockDurationMs, MIN_CONFIRMATION_TIMEOUT_MS)
});

export const FALLBACK_TEZOS_NETWORK_TIMING = makeTezosNetworkTiming(FALLBACK_BLOCK_DURATION_MS);

export const loadTezosNetworkTiming = memoizee(
  async (network: TezosNetworkEssentials): Promise<TezosNetworkTiming> => {
    try {
      const { minimal_block_delay: minimalBlockDelay } = await getTezosRpcClient(network).getConstants();
      const blockDurationMs = Number(minimalBlockDelay) * 1_000;

      return Number.isFinite(blockDurationMs) && blockDurationMs > 0
        ? makeTezosNetworkTiming(blockDurationMs)
        : FALLBACK_TEZOS_NETWORK_TIMING;
    } catch {
      return FALLBACK_TEZOS_NETWORK_TIMING;
    }
  },
  {
    promise: true,
    max: MAX_MEMOIZED_TOOLKITS,
    maxAge: BAKING_STAKE_SYNC_INTERVAL,
    normalizer: ([network]) => `${network.chainId}@${network.rpcBaseURL}`
  }
);
