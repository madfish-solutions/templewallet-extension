import { RouteDirectionEnum } from 'swap-router-sdk';

import { AssetMetadata, getAssetSymbol } from 'lib/temple/metadata';

export const getPoolName = (
  direction: RouteDirectionEnum,
  aTokenMetadata: AssetMetadata | null,
  bTokenMetadata: AssetMetadata | null
) => {
  switch (direction) {
    case RouteDirectionEnum.Direct:
      return `${getAssetSymbol(aTokenMetadata)}/${getAssetSymbol(bTokenMetadata)}`;
    case RouteDirectionEnum.Inverted:
      return `${getAssetSymbol(bTokenMetadata)}/${getAssetSymbol(aTokenMetadata)}`;
  }
};
