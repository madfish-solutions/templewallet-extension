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
  PlentyTokenToTokenStable = 'PlentyTokenToTokenStable',
  PlentyTokenToTokenVolatile = 'PlentyTokenToTokenVolatile',
  PlentyCtezStable = 'PlentyCtezStable',
  QuipuSwapTokenToTokenStable = 'QuipuSwapTokenToTokenStable',
  QuipuSwapTezToTokenFa12 = 'QuipuSwapTezToTokenFa12',
  QuipuSwapTezToTokenFa2 = 'QuipuSwapTezToTokenFa2',
  QuipuSwapTokenToToken = 'QuipuSwapTokenToToken',
  QuipuSwapDex2 = 'QuipuSwapDex2',
  QuipuSwapV3 = 'QuipuSwapV3',
  DexterLb = 'DexterLb',
  FlatYouvesStable = 'FlatYouvesStable',
  FlatYouvesStableUXTZ = 'FlatYouvesStableUXTZ',
  VortexTokenToTokenFa12 = 'VortexTokenToTokenFa12',
  VortexTokenToTokenFa2 = 'VortexTokenToTokenFa2',
  SpicyTokenToToken = 'SpicyTokenToToken',
  WTZSwap = 'WTZSwap',
  wTEZSwap = 'wTEZSwap',
  CtezToXtz = 'CtezToXtz',
  PlentyWrappedTokenBridgeSwap = 'PlentyWrappedTokenBridgeSwap'
}

export const fetchRoute3Dexes$ = () =>
  from(route3Api.get<Array<Route3Dex>>('/dexes')).pipe(map(response => response.data));
