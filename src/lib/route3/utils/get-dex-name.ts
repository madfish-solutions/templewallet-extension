import { Route3DexTypeEnum } from 'lib/apis/route3/fetch-route3-dexes';

export const getDexName = (dexType: Route3DexTypeEnum | undefined) => {
  switch (dexType) {
    case Route3DexTypeEnum.QuipuSwapDex2:
    case Route3DexTypeEnum.QuipuSwapTezToTokenFa12:
    case Route3DexTypeEnum.QuipuSwapTezToTokenFa2:
      return 'QuipuSwap';
    case Route3DexTypeEnum.QuipuSwapTokenToToken:
      return 'QuipuSwap Token to Token';
    case Route3DexTypeEnum.QuipuSwapTokenToTokenStable:
      return 'QuipuSwap Curve Like';
    case Route3DexTypeEnum.PlentyTokenToToken:
    case Route3DexTypeEnum.PlentyCtezStable:
      return 'Plenty';
    case Route3DexTypeEnum.PlentyWrappedTokenBridgeSwap:
      return 'Plenty Bridge';
    case Route3DexTypeEnum.PlentyTokenToTokenStable:
      return 'Plenty Stable Swap';
    case Route3DexTypeEnum.PlentyTokenToTokenVolatile:
      return 'Plenty Volatile Swap';
    case Route3DexTypeEnum.DexterLb:
      return 'Dexter LB';
    case Route3DexTypeEnum.FlatYouvesStable:
      return 'Youves';
    case Route3DexTypeEnum.VortexTokenToTokenFa12:
    case Route3DexTypeEnum.VortexTokenToTokenFa2:
      return 'Vortex';
    case Route3DexTypeEnum.SpicyTokenToToken:
      return 'Spicy';
    case Route3DexTypeEnum.CtezToXtz:
      return 'Ctez';
    case Route3DexTypeEnum.WTZSwap:
      return 'WTZ';

    default:
      return 'Unknown dex';
  }
};
