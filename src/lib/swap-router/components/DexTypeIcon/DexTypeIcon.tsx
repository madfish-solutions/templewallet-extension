import React, { FC } from 'react';

import { AssetIcon } from 'app/templates/AssetIcon';
import { Route3DexTypeEnum } from 'lib/apis/route3/fetch-route3-dexes';

import { ReactComponent as CtezIcon } from './icons/ctez-icon.svg';
import { ReactComponent as PlentyIcon } from './icons/plenty.svg';
import { ReactComponent as QuipuSwapIcon } from './icons/quipu-swap-icon.svg';
import { ReactComponent as SpicyIcon } from './icons/spicy.svg';
import { ReactComponent as VortexIcon } from './icons/vortex.svg';
import { ReactComponent as YouvesIcon } from './icons/youves.svg';

interface Props {
  dexType: Route3DexTypeEnum | null;
}

export const DexTypeIcon: FC<Props> = ({ dexType }) => {
  switch (dexType) {
    case Route3DexTypeEnum.QuipuSwapDex2:
    case Route3DexTypeEnum.QuipuSwapTezToTokenFa12:
    case Route3DexTypeEnum.QuipuSwapTezToTokenFa2:
    case Route3DexTypeEnum.QuipuSwapTokenToToken:
    case Route3DexTypeEnum.QuipuSwapTokenToTokenStable:
      return <QuipuSwapIcon />;
    case Route3DexTypeEnum.PlentyCtezStable:
    case Route3DexTypeEnum.PlentyTokenToToken:
    case Route3DexTypeEnum.PlentyTokenToTokenStable:
    case Route3DexTypeEnum.PlentyTokenToTokenVolatile:
    case Route3DexTypeEnum.PlentyWrappedTokenBridgeSwap:
      return <PlentyIcon />;
    case Route3DexTypeEnum.FlatYouvesStable:
      return <YouvesIcon />;
    case Route3DexTypeEnum.VortexTokenToTokenFa12:
    case Route3DexTypeEnum.VortexTokenToTokenFa2:
      return <VortexIcon />;
    case Route3DexTypeEnum.SpicyTokenToToken:
      return <SpicyIcon />;
    case Route3DexTypeEnum.CtezToXtz:
      return <CtezIcon />;

    default:
      return <AssetIcon assetSlug="" size={24} />;
  }
};
