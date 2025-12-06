import { COMMON_MAINNET_CHAIN_IDS, ETHEREUM_HOODI_CHAIN_ID, ETHEREUM_MAINNET_CHAIN_ID } from 'lib/temple/types';

interface MulticallBatchOptions {
  batchSize: number;
  wait?: number;
  maxSize?: number;
}

const DEFAULT_MULTICALL_OPTIONS: MulticallBatchOptions = {
  batchSize: 64,
  wait: 20,
  maxSize: 4_096
};

const MULTICALL_OPTIONS_BY_CHAIN: Partial<Record<number, MulticallBatchOptions>> = {
  [ETHEREUM_MAINNET_CHAIN_ID]: {
    batchSize: 160,
    wait: 25,
    maxSize: 10_240
  },
  [COMMON_MAINNET_CHAIN_IDS.polygon]: {
    batchSize: 96,
    wait: 30,
    maxSize: 6_144
  },
  [COMMON_MAINNET_CHAIN_IDS.bsc]: {
    batchSize: 80,
    wait: 30,
    maxSize: 6_144
  },
  [COMMON_MAINNET_CHAIN_IDS.avalanche]: {
    batchSize: 120,
    wait: 25
  },
  [COMMON_MAINNET_CHAIN_IDS.optimism]: {
    batchSize: 96,
    wait: 25
  },
  [COMMON_MAINNET_CHAIN_IDS.arbitrum]: {
    batchSize: 120,
    wait: 25
  },
  [COMMON_MAINNET_CHAIN_IDS.base]: {
    batchSize: 96,
    wait: 20
  },
  [ETHEREUM_HOODI_CHAIN_ID]: {
    batchSize: 160,
    wait: 25,
    maxSize: 10_240
  }
};

export const getMulticallBatchOptions = (chainId: number): MulticallBatchOptions => {
  return MULTICALL_OPTIONS_BY_CHAIN[chainId] ?? DEFAULT_MULTICALL_OPTIONS;
};
