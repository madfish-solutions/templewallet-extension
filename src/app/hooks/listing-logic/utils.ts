import { fromChainAssetSlug } from 'lib/assets/utils';

export const getSlugWithChainId = <T>(chainSlug: string) => {
  const [_, chainId, assetSlug] = fromChainAssetSlug<T>(chainSlug);

  return { chainId, assetSlug };
};

export const getSlugFromChainSlug = (chainSlug: string) => getSlugWithChainId(chainSlug).assetSlug;
