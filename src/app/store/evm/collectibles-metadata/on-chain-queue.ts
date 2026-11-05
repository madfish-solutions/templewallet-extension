import { EvmNetworkEssentials } from 'temple/networks';

/** How many tokenURI reads run together. Each one can pull an IPFS document. */
export const ON_CHAIN_COLLECTIBLES_BATCH_SIZE = 50;

/** Pause between on-chain batches of visible NFTs. */
export const ON_CHAIN_COLLECTIBLES_BATCH_DELAY_MS = 4_000;

export interface DeferredEvmCollectibleOnChainLoad {
  chain: EvmNetworkEssentials;
  slug: string;
}

export const splitOnChainCollectibleBatch = (items: readonly DeferredEvmCollectibleOnChainLoad[]) => ({
  now: items.slice(0, ON_CHAIN_COLLECTIBLES_BATCH_SIZE),
  later: items.slice(ON_CHAIN_COLLECTIBLES_BATCH_SIZE)
});
