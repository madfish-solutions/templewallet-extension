import { TempleChainKind } from 'temple/types';

export type CrossChainDest = 'tezos' | 'evm' | 'btc';

export interface CrossChainAsset {
  dest: CrossChainDest;
  /** Temple chain kind — undefined for BTC pseudo-destination */
  chainKind?: TempleChainKind;
  /** Temple chain id — undefined for BTC */
  chainId?: string | number;
  /** Temple asset slug — undefined for BTC */
  assetSlug?: string;
  /** Exolix coin code (e.g. 'ETH', 'USDT', 'USDC', 'XTZ', 'BTC') */
  exolixCoin: string;
  /** Exolix network code (e.g. 'ETH', 'XTZ', 'BTC') */
  exolixNetwork: string;
  symbol: string;
  decimals: number;
  name: string;
  iconUrl?: string;
}
