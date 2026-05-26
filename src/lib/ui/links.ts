import { TempleChainKind } from 'temple/types';

export const toExploreAssetLink = (
  isCollectible: boolean,
  chainKind: TempleChainKind,
  chainId: number | string,
  assetSlug: string
) => `/${isCollectible ? 'collectible' : 'token'}/${chainKind}/${chainId}/${assetSlug}`;
