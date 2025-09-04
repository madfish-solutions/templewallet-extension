import { SpotToken } from '@nktkas/hyperliquid';

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
  dayNtlVlm: number;
  type: 'spot' | 'perp';
}

interface SpotTradePair extends TradePairBase {
  type: 'spot';
  baseToken: SpotToken;
  quoteToken: SpotToken;
}

interface PerpTradePair extends TradePairBase {
  type: 'perp';
  fundingRate: string;
  szDecimals: number;
  maxLeverage: number;
}

export type TradePair = SpotTradePair | PerpTradePair;
