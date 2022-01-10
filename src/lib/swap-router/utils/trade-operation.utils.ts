import { AssetMetadata } from '../../temple/metadata';
import { DexTypeEnum } from '../backend/enums/dex-type.enum';
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
      return `${aTokenMetadata.symbol}/${bTokenMetadata.symbol}`;
    case RouteDirectionEnum.Inverted:
      return `${bTokenMetadata.symbol}/${aTokenMetadata.symbol}`;
  }
};
