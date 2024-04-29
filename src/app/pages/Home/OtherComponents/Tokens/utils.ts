import { TempleChainKind } from 'temple/types';

export const toExploreAssetLink = (chainKink: TempleChainKind, chainId: number | string, assetSlug: string) =>
  `/explore/${chainKink}/${chainId}/${assetSlug}`;
