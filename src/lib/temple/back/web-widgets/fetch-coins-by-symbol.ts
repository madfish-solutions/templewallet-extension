import { fetchCoinsByIds, fetchTopCoinsByMarketCap, type TopCoinRaw } from 'lib/apis/coingecko';
import { fetchTopCoinsFromPaprika } from 'lib/apis/coinpaprika';

export interface CoinMetadata {
  symbol: string;
  name: string;
  iconUrl: string;
  marketCap: number;
}

export type CoinsBySymbol = Record<string, CoinMetadata>;

const PAGES = 4;
const TOP_N = PAGES * 250;
const TTL_MS = 10 * 60 * 1000;

const SUPPLEMENTAL_IDS = ['wrapped-bitcoin', 'weth', 'wrapped-steth', 'coinbase-wrapped-btc'];

let cache: { data: CoinsBySymbol; builtAt: number } | null = null;

const fetchTopCoins = async (): Promise<TopCoinRaw[]> => {
  const primary = await fetchTopCoinsByMarketCap(PAGES);
  if (primary.length > 0) {
    const supplemental = await fetchCoinsByIds(SUPPLEMENTAL_IDS);
    return [...primary, ...supplemental];
  }

  try {
    return await fetchTopCoinsFromPaprika(TOP_N);
  } catch {
    return [];
  }
};

const buildCoinsBySymbol = async (): Promise<CoinsBySymbol> => {
  const coins = await fetchTopCoins();

  const bySymbol: CoinsBySymbol = {};
  for (const coin of coins) {
    const key = coin.symbol.toUpperCase();
    const marketCap = coin.market_cap ?? 0;
    const existing = bySymbol[key];
    if (!existing || marketCap > existing.marketCap) {
      bySymbol[key] = { symbol: key, name: coin.name, iconUrl: coin.image ?? '', marketCap };
    }
  }

  return bySymbol;
};

export const getCoinsBySymbol = async (): Promise<CoinsBySymbol> => {
  if (cache && Date.now() - cache.builtAt <= TTL_MS) {
    return cache.data;
  }

  try {
    const data = await buildCoinsBySymbol();
    if (Object.keys(data).length === 0) {
      return cache?.data ?? {};
    }
    cache = { data, builtAt: Date.now() };
    return data;
  } catch {
    return cache?.data ?? {};
  }
};
