import { BigNumber } from 'bignumber.js';

export interface Route3SwapParamsRequestRaw {
  fromSymbol: string;
  toSymbol: string;
  toTokenDecimals: number;
  amount: string | undefined;
  dexesLimit: number;
  /** Needed to make a correction of params if input is SIRS */
  rpcUrl: string;
}

// TODO: add `showTree: boolean` when adding route view
interface Route3SwapParamsRequestBase {
  fromSymbol: string;
  toSymbol: string;
  toTokenDecimals: number;
  amount: string;
  /** Needed to make a correction of params if input is SIRS */
  rpcUrl: string;
}

export interface Route3SwapParamsRequest extends Route3SwapParamsRequestBase {
  dexesLimit: number;
}

export interface Route3LbSwapParamsRequest extends Route3SwapParamsRequestBase {
  xtzDexesLimit: number;
  tzbtcDexesLimit: number;
}

export interface Hop {
  dex_id: number;
  code: number;
  amount_from_token_in_reserves: BigNumber;
  amount_from_trading_balance: BigNumber;
  params: string | null;
}

export interface Route3Hop {
  dexId: number;
  tokenInAmount: string;
  tradingBalanceAmount: string;
  code: number;
  params: string | null;
}

export interface Route3TraditionalSwapParamsResponse {
  input: string | undefined;
  output: string | undefined;
  hops: Route3Hop[];
}

export interface Route3LiquidityBakingParamsResponse {
  input: string | undefined;
  output: string | undefined;
  tzbtcHops: Route3Hop[];
  xtzHops: Route3Hop[];
}

export type Route3SwapHops = Pick<Route3TraditionalSwapParamsResponse, 'hops'>;

export type Route3LiquidityBakingHops = Pick<Route3LiquidityBakingParamsResponse, 'tzbtcHops' | 'xtzHops'>;

export type Route3SwapParamsResponse = Route3TraditionalSwapParamsResponse | Route3LiquidityBakingParamsResponse;

export const isSwapHops = (hops: Route3SwapHops | Route3LiquidityBakingHops): hops is Route3SwapHops => 'hops' in hops;

export const isLiquidityBakingParamsResponse = (
  response: Route3SwapParamsResponse
): response is Route3LiquidityBakingParamsResponse => 'tzbtcHops' in response && 'xtzHops' in response;
