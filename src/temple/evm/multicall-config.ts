import { MulticallBatchOptions } from 'viem';

import { COMMON_MAINNET_CHAIN_IDS, ETHEREUM_HOODI_CHAIN_ID, ETHEREUM_MAINNET_CHAIN_ID } from 'lib/temple/types';

const DEFAULT_MULTICALL_OPTIONS: MulticallBatchOptions = { batchSize: 4_096, wait: 20 };

const MULTICALL_OPTIONS_BY_CHAIN: Partial<Record<number, MulticallBatchOptions>> = {
  [ETHEREUM_MAINNET_CHAIN_ID]: { batchSize: 10_240, wait: 25 },
  [COMMON_MAINNET_CHAIN_IDS.polygon]: { batchSize: 6_144, wait: 30 },
  [COMMON_MAINNET_CHAIN_IDS.bsc]: { batchSize: 6_144, wait: 30 },
  [COMMON_MAINNET_CHAIN_IDS.avalanche]: { wait: 25 },
  [COMMON_MAINNET_CHAIN_IDS.optimism]: { wait: 25 },
  [COMMON_MAINNET_CHAIN_IDS.arbitrum]: { wait: 25 },
  [COMMON_MAINNET_CHAIN_IDS.base]: { wait: 20 },
  [ETHEREUM_HOODI_CHAIN_ID]: { batchSize: 10_240, wait: 25 }
};

export const getMulticallBatchOptions = (chainId: number): MulticallBatchOptions => {
  return MULTICALL_OPTIONS_BY_CHAIN[chainId] ?? DEFAULT_MULTICALL_OPTIONS;
};
