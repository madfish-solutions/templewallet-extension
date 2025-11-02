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
  1: {
    batchSize: 160,
    wait: 25,
    maxSize: 10_240
  },
  137: {
    batchSize: 96,
    wait: 30,
    maxSize: 6_144
  },
  56: {
    batchSize: 80,
    wait: 30,
    maxSize: 6_144
  },
  43114: {
    batchSize: 120,
    wait: 25
  },
  10: {
    batchSize: 96,
    wait: 25
  },
  42161: {
    batchSize: 120,
    wait: 25
  },
  8453: {
    batchSize: 96,
    wait: 20
  }
};

export const getMulticallBatchOptions = (chainId: number): MulticallBatchOptions => {
  return MULTICALL_OPTIONS_BY_CHAIN[chainId] ?? DEFAULT_MULTICALL_OPTIONS;
};

export const getMulticallCallOptions = (chainId: number) => {
  const { batchSize } = getMulticallBatchOptions(chainId);

  return { batchSize };
};


