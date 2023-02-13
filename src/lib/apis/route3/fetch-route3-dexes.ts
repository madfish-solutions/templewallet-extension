import { from, map } from 'rxjs';

import { route3Api } from './route3.api';

interface Route3Token {
  id: number;
  symbol: string;
  standard: 'fa12' | 'fa2' | 'xtz';
  contract: string | null;
  tokenId: string | null;
  decimals: number;
}

export interface Route3Dex {
  id: 97;
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
  DexterLb = 'DexterLb',
  FlatYouvesStable = 'FlatYouvesStable',
  VortexTokenToTokenFa12 = 'VortexTokenToTokenFa12',
  VortexTokenToTokenFa2 = 'VortexTokenToTokenFa2',
  SpicyTokenToToken = 'SpicyTokenToToken',
  WTZSwap = 'WTZSwap',
  CtezToXtz = 'CtezToXtz',
  PlentyWrappedTokenBridgeSwap = 'PlentyWrappedTokenBridgeSwap'
}

export const fetchRoute3Dexes$ = () =>
  from(route3Api.get<Array<Route3Dex>>('/dexes')).pipe(map(response => response.data));
