import { Route3DexTypeEnum } from 'lib/apis/route3/fetch-route3-dexes';

// TODO: use this function to display a route
// ts-prune-ignore-next
export const getDexName = (dexType: Route3DexTypeEnum | undefined) => {
  switch (dexType) {
    case Route3DexTypeEnum.QuipuSwapDex2:
    case Route3DexTypeEnum.QuipuSwapTezToTokenFa12:
    case Route3DexTypeEnum.QuipuSwapTezToTokenFa2:
      return 'QuipuSwap';
    case Route3DexTypeEnum.QuipuSwapTokenToToken:
      return 'QuipuSwap Token to Token';
    case Route3DexTypeEnum.QuipuSwapTokenToTokenStable:
    case Route3DexTypeEnum.QuipuSwapTokenToTokenStableV2:
      return 'QuipuSwap Curve Like';
    case Route3DexTypeEnum.QuipuSwapV3:
      return 'QuipuSwap V3';
    case Route3DexTypeEnum.PlentyTokenToToken:
    case Route3DexTypeEnum.PlentyTokenTez:
    case Route3DexTypeEnum.PlentyCtezStable:
      return 'Plenty';
    case Route3DexTypeEnum.PlentyWrappedTokenBridgeSwap:
      return 'Plenty Bridge';
    case Route3DexTypeEnum.PlentyTokenToTokenStable:
      return 'Plenty Stable Index';
    case Route3DexTypeEnum.PlentyTokenToTokenVolatile:
      return 'Plenty Volatile Index';
    case Route3DexTypeEnum.PlentySwapV3:
      return 'Plenty V3';
    case Route3DexTypeEnum.DexterLb:
      return 'Dexter LB';
    case Route3DexTypeEnum.FlatYouvesStable:
    case Route3DexTypeEnum.FlatYouvesStableUXTZ:
    case Route3DexTypeEnum.FlatYouvesCPMM:
    case Route3DexTypeEnum.YouvesTargetMultiToken2:
      return 'Youves';
    case Route3DexTypeEnum.VortexTokenToTokenFa12:
    case Route3DexTypeEnum.VortexTokenToTokenFa2:
      return 'Vortex';
    case Route3DexTypeEnum.SpicyTokenToToken:
      return 'Spicy';
    case Route3DexTypeEnum.SpicySwapStable:
      return 'Spicy Stable Index';
    case Route3DexTypeEnum.CtezToXtz:
      return 'Ctez';
    case Route3DexTypeEnum.WTZSwap:
      return 'WTZ';
    case Route3DexTypeEnum.wTEZSwap:
      return 'wTEZ';
    case Route3DexTypeEnum.oXTZSwap:
      return 'oXTZ';
    case Route3DexTypeEnum.KordTezLend:
      return 'Kord';

    default:
      return 'Unknown dex';
  }
};
