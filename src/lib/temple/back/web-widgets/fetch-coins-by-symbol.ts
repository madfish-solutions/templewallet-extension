import {
  fetchCoinsByIds,
  fetchCoinsListWithPlatforms,
  fetchTopCoinsByMarketCap,
  type TopCoinRaw
} from 'lib/apis/coingecko';
import { fetchTopCoinsFromPaprika } from 'lib/apis/coinpaprika';

import { persistentCache } from './persistent-cache';

export interface CoinMetadata {
  symbol: string;
  name: string;
  iconUrl: string;
  marketCap: number;
  id: string;
  price: number | null;
  change24h: number | null;
  fdv: number | null;
  volume: number | null;
  high24: number | null;
  low24: number | null;
}

export type CoinsBySymbol = Record<string, CoinMetadata>;

const PAGES = 4;
const TOP_N = PAGES * 250;

const SUPPLEMENTAL_IDS = ['wrapped-bitcoin', 'weth', 'wrapped-steth', 'coinbase-wrapped-btc'];

interface CoinsBundle {
  data: CoinsBySymbol;
  sparklinesById: Record<string, number[]>;
}

const fetchTopCoins = async (): Promise<TopCoinRaw[]> => {
  const [primary, supplemental] = await Promise.all([
    fetchTopCoinsByMarketCap(PAGES),
    fetchCoinsByIds(SUPPLEMENTAL_IDS)
  ]);

  if (primary.length > 0) {
    return [...primary, ...supplemental];
  }

  try {
    return await fetchTopCoinsFromPaprika(TOP_N);
  } catch {
    return [];
  }
};

const buildCoinsBySymbol = async (): Promise<CoinsBundle> => {
  const coins = await fetchTopCoins();

  const bySymbol: CoinsBySymbol = {};
  const sparklinesById: Record<string, number[]> = {};
  for (const coin of coins) {
    sparklinesById[coin.id] = coin.sparkline_in_7d?.price ?? [];

    const key = coin.symbol.toUpperCase();
    const marketCap = coin.market_cap ?? 0;
    const existing = bySymbol[key];
    if (!existing || marketCap > existing.marketCap) {
      bySymbol[key] = {
        symbol: key,
        name: coin.name,
        iconUrl: coin.image ?? '',
        marketCap,
        id: coin.id,
        price: coin.current_price ?? null,
        change24h: coin.price_change_percentage_24h ?? null,
        fdv: coin.fully_diluted_valuation ?? null,
        volume: coin.total_volume ?? null,
        high24: coin.high_24h ?? null,
        low24: coin.low_24h ?? null
      };
    }
  }

  return { data: bySymbol, sparklinesById };
};

const ensureCache = persistentCache<CoinsBundle>({
  storageKey: 'WEB_WIDGETS_COINS_BY_SYMBOL',
  ttlMs: 10 * 60 * 1000,
  fallback: { data: {}, sparklinesById: {} },
  build: buildCoinsBySymbol,
  isValid: ({ data }) => Object.keys(data).length > 0
});

export const getCoinsBySymbol = async (): Promise<CoinsBySymbol> => (await ensureCache()).data;

export const getCoinSparkline = async (id: string): Promise<number[]> => (await ensureCache()).sparklinesById[id] ?? [];

type CoinPlatforms = Record<string, Record<string, string>>;

const ensurePlatforms = persistentCache<CoinPlatforms>({
  storageKey: 'WEB_WIDGETS_COIN_PLATFORMS',
  ttlMs: 6 * 60 * 60 * 1000,
  fallback: {},
  build: async () => {
    const [entry, list] = await Promise.all([ensureCache(), fetchCoinsListWithPlatforms()]);
    if (list.length === 0) throw new Error('empty coins/list response');

    const surfaced = new Set(Object.values(entry.data).map(coin => coin.id));
    const byId: CoinPlatforms = {};
    for (const coin of list) {
      if (!coin.platforms || !surfaced.has(coin.id)) continue;
      const deployments: Record<string, string> = {};
      for (const [slug, address] of Object.entries(coin.platforms)) {
        if (address) deployments[slug] = address;
      }
      if (Object.keys(deployments).length > 0) byId[coin.id] = deployments;
    }
    return byId;
  }
});

export const getCoinPlatforms = async (coinId: string): Promise<Record<string, string>> =>
  (await ensurePlatforms())[coinId] ?? {};
