import { RouteDirectionEnum } from 'swap-router-sdk';

import type { AssetMetadata } from 'lib/temple/metadata/types';
import { getAssetSymbol } from 'lib/temple/metadata/utils';

export const getPoolName = (
  direction: RouteDirectionEnum,
  aTokenMetadata: AssetMetadata,
  bTokenMetadata: AssetMetadata
) => {
  switch (direction) {
    case RouteDirectionEnum.Direct:
      return `${getAssetSymbol(aTokenMetadata)}/${getAssetSymbol(bTokenMetadata)}`;
    case RouteDirectionEnum.Inverted:
      return `${getAssetSymbol(bTokenMetadata)}/${getAssetSymbol(aTokenMetadata)}`;
  }
};
