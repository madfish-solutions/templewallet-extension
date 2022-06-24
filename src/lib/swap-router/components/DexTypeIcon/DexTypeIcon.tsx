import React, { FC } from 'react';

import { DexTypeEnum } from 'swap-router-sdk';

import { ReactComponent as LiquidityBackingIcon } from './icons/liquidity-backing-icon.svg';
import { ReactComponent as PlentyIcon } from './icons/plenty.svg';
import { ReactComponent as QuipuSwapIcon } from './icons/quipu-swap-icon.svg';
import { ReactComponent as SpicyIcon } from './icons/spicy.svg';
import { ReactComponent as VortexIcon } from './icons/vortex.svg';
import { ReactComponent as YouvesIcon } from './icons/youves.svg';

interface Props {
  dexType: DexTypeEnum;
}

export const DexTypeIcon: FC<Props> = ({ dexType }) => {
  switch (dexType) {
    case DexTypeEnum.QuipuSwap:
    case DexTypeEnum.QuipuSwapTokenToTokenDex:
    case DexTypeEnum.QuipuSwapCurveLike:
      return <QuipuSwapIcon />;
    case DexTypeEnum.Plenty:
    case DexTypeEnum.PlentyBridge:
    case DexTypeEnum.PlentyStableSwap:
    case DexTypeEnum.PlentyVolatileSwap:
    case DexTypeEnum.PlentyCtez:
      return <PlentyIcon />;
    case DexTypeEnum.LiquidityBaking:
      return <LiquidityBackingIcon />;
    case DexTypeEnum.Youves:
      return <YouvesIcon />;
    case DexTypeEnum.Vortex:
      return <VortexIcon />;
    case DexTypeEnum.Spicy:
    case DexTypeEnum.SpicyWrap:
      return <SpicyIcon />;
  }
};
