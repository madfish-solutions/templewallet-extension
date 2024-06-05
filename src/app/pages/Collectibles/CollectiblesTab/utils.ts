import { TempleChainKind } from 'temple/types';

export const toCollectibleLink = (chainKind: TempleChainKind, chainId: number | string, assetSlug: string) =>
  `/collectible/${chainKind}/${chainId}/${assetSlug}`;
