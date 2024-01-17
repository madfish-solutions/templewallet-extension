import { BigNumber } from 'bignumber.js';

export interface Route3SwapParamsRequestRaw {
  fromSymbol: string;
  toSymbol: string;
  amount: string | undefined;
  chainsLimit?: number;
}
export interface Route3SwapParamsRequest {
  fromSymbol: string;
  toSymbol: string;
  amount: string;
  chainsLimit?: number;
}

export interface Hop {
  amount_opt: BigNumber | null;
  dex_id: number;
  code: number;
  params: string;
}

interface Route3Hop {
  dex: number;
  forward: boolean;
}

export interface Route3Chain {
  input: string;
  output: string;
  hops: Array<Route3Hop>;
}

export interface Route3TraditionalSwapParamsResponse {
  input: string | undefined;
  output: string | undefined;
  chains: Array<Route3Chain>;
}

export interface Route3LiquidityBakingParamsResponse {
  input: string | undefined;
  output: string | undefined;
  tzbtcChain: Route3TraditionalSwapParamsResponse;
  xtzChain: Route3TraditionalSwapParamsResponse;
}

export type Route3SwapChains = Pick<Route3TraditionalSwapParamsResponse, 'chains'>;

export type Route3LiquidityBakingChains = Pick<Route3LiquidityBakingParamsResponse, 'tzbtcChain' | 'xtzChain'>;

export type Route3SwapParamsResponse = Route3TraditionalSwapParamsResponse | Route3LiquidityBakingParamsResponse;

export const isSwapChains = (chains: Route3SwapChains | Route3LiquidityBakingChains): chains is Route3SwapChains =>
  'chains' in chains;

export const isLiquidityBakingParamsResponse = (
  response: Route3SwapParamsResponse
): response is Route3LiquidityBakingParamsResponse => 'tzbtcChain' in response && 'xtzChain' in response;
