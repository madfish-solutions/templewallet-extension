import { TempleChainKind } from 'temple/types';

export const toCollectibleLink = (chainKink: TempleChainKind, chainId: number | string, assetSlug: string) =>
  `/collectible/${chainKink}/${chainId}/${assetSlug}`;
