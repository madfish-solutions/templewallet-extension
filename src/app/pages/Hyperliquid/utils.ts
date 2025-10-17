import { SubscriptionClient, WebSocketTransport } from '@nktkas/hyperliquid';
import { BigNumber } from 'bignumber.js';

import { HyperliquidNetworkType } from './types';

export const coinsNamesByNetworkType: Record<HyperliquidNetworkType, StringRecord> = {
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

export const createSubscriptionClient = async (testnetMode: boolean) => {
  const subscription = new SubscriptionClient({
    transport: new WebSocketTransport({
      url: testnetMode ? 'wss://api.hyperliquid-testnet.xyz/ws' : 'wss://api.hyperliquid.xyz/ws',
      autoResubscribe: true,
      reconnect: {
        maxRetries: 100
      }
    })
  });
  await subscription.transport.ready();

  return subscription;
};

const HYPERLIQUID_PRICE_DIGITS = 5;
export const formatPrice = (value: BigNumber) =>
  HYPERLIQUID_PRICE_DIGITS < value.precision()
    ? value.toFixed(Math.max(0, HYPERLIQUID_PRICE_DIGITS - value.e! - 1))
    : value.toPrecision(HYPERLIQUID_PRICE_DIGITS);

export const BUILDER_FEE_UNITS = 10;
export const BUILDER_ADDRESS = '0x019e5e9eD5354b9AFf55C67e82CaE7A779a23087';
