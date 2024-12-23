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

interface Route3SwapParamsRequestBase {
  fromSymbol: string;
  toSymbol: string;
  toTokenDecimals: number;
  amount: string;
  /** Needed to make a correction of params if input is SIRS */
  rpcUrl: string;
  /** 3route API does not require it but the extension needs swaps trees */
  showTree: true;
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

export interface Route3SwapHops {
  hops: Route3Hop[];
  tree: Route3TreeNode;
}

interface Route3SwapParamsResponseBase {
  input: string | undefined;
  output: string | undefined;
}

export interface Route3TraditionalSwapParamsResponse extends Route3SwapHops, Route3SwapParamsResponseBase {}

export interface Route3LiquidityBakingHops {
  tzbtcHops: Route3Hop[];
  xtzHops: Route3Hop[];
  tzbtcTree: Route3TreeNode;
  xtzTree: Route3TreeNode;
}

export interface Route3LiquidityBakingParamsResponse extends Route3LiquidityBakingHops, Route3SwapParamsResponseBase {}

export type Route3SwapParamsResponse = Route3TraditionalSwapParamsResponse | Route3LiquidityBakingParamsResponse;

export const isSwapHops = (hops: Route3SwapHops | Route3LiquidityBakingHops): hops is Route3SwapHops => 'hops' in hops;

export const isLiquidityBakingParamsResponse = (
  response: Route3SwapParamsResponse
): response is Route3LiquidityBakingParamsResponse => 'tzbtcHops' in response && 'xtzHops' in response;

export enum Route3TreeNodeType {
  Empty = 'Empty',
  High = 'High',
  Dex = 'Dex',
  Wide = 'Wide'
}

interface Route3TreeNodeBase {
  type: Route3TreeNodeType;
  tokenInId: number;
  tokenOutId: number;
  tokenInAmount: string;
  tokenOutAmount: string;
  width: number;
  height: number;
  items: Route3NonEmptyNode[] | null;
  dexId: number | null;
}

export interface Route3EmptyTreeNode extends Route3TreeNodeBase {
  type: Route3TreeNodeType.Empty;
  items: [];
  dexId: null;
}

interface Route3NonTerminalTreeNode extends Route3TreeNodeBase {
  type: Route3TreeNodeType.High | Route3TreeNodeType.Wide;
  items: Route3NonEmptyNode[];
  dexId: null;
}

interface Route3DexTreeNode extends Route3TreeNodeBase {
  type: Route3TreeNodeType.Dex;
  items: null;
  dexId: number;
}

type Route3NonEmptyNode = Route3NonTerminalTreeNode | Route3DexTreeNode;

export type Route3TreeNode = Route3EmptyTreeNode | Route3NonEmptyNode;
