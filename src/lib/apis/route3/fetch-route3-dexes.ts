import { from, map } from 'rxjs';

import { Route3Token } from './fetch-route3-tokens';
import { route3Api } from './route3.api';

export interface Route3Dex {
  id: number;
  type: Route3DexTypeEnum;
  contract: string;
  token1: Route3Token;
  token2: Route3Token;
}

export enum Route3DexTypeEnum {
  PlentyTokenToToken = 'PlentyTokenToToken',
  PlentyTokenTez = 'PlentyTokenTez',
  PlentyTokenToTokenStable = 'PlentyTokenToTokenStable',
  PlentyTokenToTokenVolatile = 'PlentyTokenToTokenVolatile',
  PlentyCtezStable = 'PlentyCtezStable',
  PlentyWrappedTokenBridgeSwap = 'PlentyWrappedTokenBridgeSwap',
  PlentySwapV3 = 'PlentySwapV3',
  QuipuSwapTokenToTokenStable = 'QuipuSwapTokenToTokenStable',
  QuipuSwapTokenToTokenStableV2 = 'QuipuSwapTokenToTokenStableV2',
  QuipuSwapTezToTokenFa12 = 'QuipuSwapTezToTokenFa12',
  QuipuSwapTezToTokenFa2 = 'QuipuSwapTezToTokenFa2',
  QuipuSwapTokenToToken = 'QuipuSwapTokenToToken',
  QuipuSwapDex2 = 'QuipuSwapDex2',
  QuipuSwapV3 = 'QuipuSwapV3',
  DexterLb = 'DexterLb',
  FlatYouvesStable = 'FlatYouvesStable',
  FlatYouvesStableUXTZ = 'FlatYouvesStableUXTZ',
  FlatYouvesCPMM = 'FlatYouvesCPMM',
  YouvesTargetMultiToken2 = 'YouvesTargetMultiToken2',
  VortexTokenToTokenFa12 = 'VortexTokenToTokenFa12',
  VortexTokenToTokenFa2 = 'VortexTokenToTokenFa2',
  SpicyTokenToToken = 'SpicyTokenToToken',
  SpicySwapStable = 'SpicySwapStable',
  WTZSwap = 'WTZSwap',
  wTEZSwap = 'wTEZSwap',
  CtezToXtz = 'CtezToXtz',
  oXTZSwap = 'oXTZSwap',
  KordTezLend = 'KordTezLend',
  SiriusRemoveLiquidityToTez = 'SiriusRemoveLiquidityToTez',
  SiriusRemoveLiquidityToTzBtc = 'SiriusRemoveLiquidityToTzBtc'
}

export const fetchRoute3Dexes$ = () =>
  from(route3Api.get<Array<Route3Dex>>('/dexes')).pipe(map(response => response.data));
