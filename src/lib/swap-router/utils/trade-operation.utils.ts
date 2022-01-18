import { AssetMetadata, getAssetSymbol } from 'lib/temple/metadata';

import { DexTypeEnum } from '../enum/dex-type.enum';
import { RouteDirectionEnum } from '../enum/route-direction.enum';

export const getDexName = (dexType: DexTypeEnum) => {
  switch (dexType) {
    case DexTypeEnum.QuipuSwap:
      return 'QuipuSwap';
    case DexTypeEnum.Plenty:
      return 'Plenty';
    case DexTypeEnum.LiquidityBaking:
      return 'Liquidity Backing';
  }
};

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
