import { EvmNetworkEssentials } from 'temple/networks';

import { ON_CHAIN_COLLECTIBLES_BATCH_SIZE, splitOnChainCollectibleBatch } from './on-chain-queue';

const chain = (chainId: number): EvmNetworkEssentials => ({
  chainId,
  rpcBaseURL: 'https://rpc.example'
});

describe('splitOnChainCollectibleBatch', () => {
  it('keeps one small batch now and the rest for later', () => {
    const items = Array.from({ length: ON_CHAIN_COLLECTIBLES_BATCH_SIZE + 2 }, (_, index) => ({
      chain: chain(1),
      slug: String(index)
    }));
    const { now, later } = splitOnChainCollectibleBatch(items);

    expect(now).toHaveLength(ON_CHAIN_COLLECTIBLES_BATCH_SIZE);
    expect(later.map(item => item.slug)).toEqual([
      String(ON_CHAIN_COLLECTIBLES_BATCH_SIZE),
      String(ON_CHAIN_COLLECTIBLES_BATCH_SIZE + 1)
    ]);
  });
});
