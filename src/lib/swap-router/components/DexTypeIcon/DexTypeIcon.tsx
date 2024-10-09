import React, { FC } from 'react';

import { TezosTokenIcon } from 'app/templates/AssetIcon';
import { Route3DexTypeEnum } from 'lib/apis/route3/fetch-route3-dexes';

import { ReactComponent as CtezIcon } from './icons/ctez-icon.svg';
import DexterLogoSrc from './icons/dexter.png';
import { ReactComponent as PlentyIcon } from './icons/plenty.svg';
import { ReactComponent as QuipuSwapIcon } from './icons/quipu-swap-icon.svg';
import { ReactComponent as SpicyIcon } from './icons/spicy.svg';
import { ReactComponent as VortexIcon } from './icons/vortex.svg';
import WtzLogoSrc from './icons/wtz.png';
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
    case Route3DexTypeEnum.QuipuSwapV3:
      return <QuipuSwapIcon height={20} width={20} />;
    case Route3DexTypeEnum.PlentyCtezStable:
    case Route3DexTypeEnum.PlentyTokenToToken:
    case Route3DexTypeEnum.PlentyTokenToTokenStable:
    case Route3DexTypeEnum.PlentyTokenToTokenVolatile:
    case Route3DexTypeEnum.PlentyWrappedTokenBridgeSwap:
      return <PlentyIcon height={20} width={20} />;
    case Route3DexTypeEnum.FlatYouvesStable:
    case Route3DexTypeEnum.FlatYouvesStableUXTZ:
      return <YouvesIcon height={20} width={20} />;
    case Route3DexTypeEnum.VortexTokenToTokenFa12:
    case Route3DexTypeEnum.VortexTokenToTokenFa2:
      return <VortexIcon height={20} width={20} />;
    case Route3DexTypeEnum.SpicyTokenToToken:
      return <SpicyIcon height={20} width={20} />;
    case Route3DexTypeEnum.CtezToXtz:
      return <CtezIcon height={20} width={20} />;
    case Route3DexTypeEnum.DexterLb:
      return <img src={DexterLogoSrc} height={20} width={20} alt="Dexter logo" />;
    case Route3DexTypeEnum.WTZSwap:
    case Route3DexTypeEnum.wTEZSwap:
      return <img src={WtzLogoSrc} height={20} width={20} alt="Dexter logo" />;

    default:
      return <TezosTokenIcon tezosChainId="" assetSlug="" size={24} />;
  }
};
