import { HyperliquidNetworkType } from './types';

const coinsNamesByNetworkType: Record<HyperliquidNetworkType, StringRecord> = {
  testnet: {
    UNIT: 'BTC',
    UETH: 'ETH',
    USOL: 'SOL',
    UFART: 'FARTCOIN',
    TZERO: 'USDT',
    UPUMP: 'PUMP',
    USPXS: 'SPX'
  },
  mainnet: {
    UBTC: 'BTC',
    UETH: 'ETH',
    USOL: 'SOL',
    UFART: 'FARTCOIN',
    USDT0: 'USDT',
    HPENGU: 'PENGU',
    XAUT0: 'XAUT',
    UPUMP: 'PUMP',
    PUMP: 'PUMP-26',
    UUUSPX: 'SPX',
    UBONK: 'BONK',
    WMNT: 'MNT'
  }
};

export const getDisplayCoinName = (coinName: string, networkType: HyperliquidNetworkType) =>
  coinsNamesByNetworkType[networkType][coinName] || coinName;
