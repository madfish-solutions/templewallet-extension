import {
  PerpsClearinghouseState,
  SpotClearinghouseState,
  SpotToken as HlSpotToken,
  WsL2BookParameters
} from '@nktkas/hyperliquid';

export type CandleChartInterval =
  | '1m'
  | '3m'
  | '5m'
  | '15m'
  | '30m'
  | '1h'
  | '2h'
  | '4h'
  | '8h'
  | '12h'
  | '1d'
  | '3d'
  | '1w'
  | '1M';

export type HyperliquidNetworkType = 'mainnet' | 'testnet';

interface TradePairBase {
  id: number;
  index: number;
  internalName: string;
  name: string;
  iconName: string;
  prevDayPx: string;
  markPx: string;
  midPx: string;
  dayNtlVlm: number;
  type: 'spot' | 'perp';
}

interface SpotToken extends HlSpotToken {
  displayName: string;
}

export interface SpotTradePair extends TradePairBase {
  type: 'spot';
  baseToken: SpotToken;
  quoteToken: SpotToken;
}

export interface PerpTradePair extends TradePairBase {
  type: 'perp';
  fundingRate: string;
  szDecimals: number;
  maxLeverage: number;
}

export interface AccountStates {
  spotState: SpotClearinghouseState;
  perpsState: PerpsClearinghouseState;
}

export const isSpotTradePair = (tradePair: TradePair): tradePair is SpotTradePair => tradePair.type === 'spot';
export const isPerpTradePair = (tradePair: TradePair): tradePair is PerpTradePair => tradePair.type === 'perp';

export type TradePair = SpotTradePair | PerpTradePair;

export type OrderBookPrecision = Pick<WsL2BookParameters, 'mantissa' | 'nSigFigs'>;
