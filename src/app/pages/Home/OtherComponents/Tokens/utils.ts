import type { ReactNode } from 'react';

import { TempleChainKind } from 'temple/types';

export const toExploreAssetLink = (chainKind: TempleChainKind, chainId: number | string, assetSlug: string) =>
  `/explore/${chainKind}/${chainId}/${assetSlug}`;

export const getTokensViewWithPromo = (tokensJsx: ReactNode[], promoJsx: ReactNode, slugsCount = tokensJsx.length) => {
  if (slugsCount < 5) {
    tokensJsx.push(promoJsx);
  } else {
    tokensJsx.splice(2, 0, promoJsx);
  }

  return tokensJsx;
};
