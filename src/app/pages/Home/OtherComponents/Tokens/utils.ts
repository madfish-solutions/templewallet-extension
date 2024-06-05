import { TempleChainKind } from 'temple/types';

export const toExploreAssetLink = (chainKind: TempleChainKind, chainId: number | string, assetSlug: string) =>
  `/explore/${chainKind}/${chainId}/${assetSlug}`;
