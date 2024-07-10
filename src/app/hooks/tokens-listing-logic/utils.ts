import { fromChainAssetSlug } from 'lib/assets/utils';
import { EvmChain, TezosChain } from 'temple/front';

export const getChainName = (chain?: TezosChain | EvmChain) => chain?.name ?? 'Unknown chain';

export const getSlugWithChainId = <T>(chainSlug: string) => {
  const [_, chainId, assetSlug] = fromChainAssetSlug<T>(chainSlug);

  return { chainId, assetSlug };
};

export const getSlugFromChainSlug = (chainSlug: string) => getSlugWithChainId(chainSlug).assetSlug;
