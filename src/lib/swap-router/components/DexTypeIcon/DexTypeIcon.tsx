import React, { FC } from 'react';

import { TezosAssetIcon } from 'app/templates/AssetIcon';
import { Route3DexTypeEnum } from 'lib/apis/route3/fetch-route3-dexes';

import { ReactComponent as CtezIcon } from './icons/ctez-icon.svg';
import DexterLogoSrc from './icons/dexter.png';
import KordLogoSrc from './icons/kord.png';
import { ReactComponent as OxtzIcon } from './icons/oxtz.svg';
import { ReactComponent as PlentyIcon } from './icons/plenty.svg';
import { ReactComponent as QuipuSwapIcon } from './icons/quipu-swap-icon.svg';
import { ReactComponent as SpicyIcon } from './icons/spicy.svg';
import { ReactComponent as VortexIcon } from './icons/vortex.svg';
import { ReactComponent as WtezIcon } from './icons/wtez.svg';
import WtzLogoSrc from './icons/wtz.png';
import { ReactComponent as YouvesIcon } from './icons/youves.svg';

interface Props {
  dexType: Route3DexTypeEnum | null;
}

// TODO: use this component to display a route
// ts-prune-ignore-next
export const DexTypeIcon: FC<Props> = ({ dexType }) => {
  switch (dexType) {
    case Route3DexTypeEnum.QuipuSwapDex2:
    case Route3DexTypeEnum.QuipuSwapTezToTokenFa12:
    case Route3DexTypeEnum.QuipuSwapTezToTokenFa2:
    case Route3DexTypeEnum.QuipuSwapTokenToToken:
    case Route3DexTypeEnum.QuipuSwapTokenToTokenStable:
    case Route3DexTypeEnum.QuipuSwapTokenToTokenStableV2:
    case Route3DexTypeEnum.QuipuSwapV3:
      return <QuipuSwapIcon height={20} width={20} />;
    case Route3DexTypeEnum.PlentyCtezStable:
    case Route3DexTypeEnum.PlentyTokenToToken:
    case Route3DexTypeEnum.PlentyTokenTez:
    case Route3DexTypeEnum.PlentyTokenToTokenStable:
    case Route3DexTypeEnum.PlentyTokenToTokenVolatile:
    case Route3DexTypeEnum.PlentyWrappedTokenBridgeSwap:
    case Route3DexTypeEnum.PlentySwapV3:
      return <PlentyIcon height={20} width={20} />;
    case Route3DexTypeEnum.FlatYouvesStable:
    case Route3DexTypeEnum.FlatYouvesStableUXTZ:
    case Route3DexTypeEnum.FlatYouvesCPMM:
    case Route3DexTypeEnum.YouvesTargetMultiToken2:
      return <YouvesIcon height={20} width={20} />;
    case Route3DexTypeEnum.VortexTokenToTokenFa12:
    case Route3DexTypeEnum.VortexTokenToTokenFa2:
      return <VortexIcon height={20} width={20} />;
    case Route3DexTypeEnum.SpicyTokenToToken:
    case Route3DexTypeEnum.SpicySwapStable:
      return <SpicyIcon height={20} width={20} />;
    case Route3DexTypeEnum.CtezToXtz:
      return <CtezIcon height={20} width={20} />;
    case Route3DexTypeEnum.DexterLb:
      return <img src={DexterLogoSrc} height={20} width={20} alt="Dexter logo" />;
    case Route3DexTypeEnum.WTZSwap:
      return <img src={WtzLogoSrc} height={20} width={20} alt="WTZ logo" />;
    case Route3DexTypeEnum.wTEZSwap:
      return <WtezIcon height={20} width={20} />;
    case Route3DexTypeEnum.oXTZSwap:
      return <OxtzIcon height={20} width={20} />;
    case Route3DexTypeEnum.KordTezLend:
      return <img src={KordLogoSrc} height={20} width={20} alt="Kord logo" />;

    default:
      return <TezosAssetIcon tezosChainId="" assetSlug="" size={24} />;
  }
};
