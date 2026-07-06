import {
  fetchCoinsByCategory,
  fetchCoinsByIds,
  fetchCoinsListWithPlatforms,
  fetchTopCoinsByMarketCap,
  type TopCoinRaw
} from 'lib/apis/coingecko';
import { fetchTopCoinsFromPaprika } from 'lib/apis/coinpaprika';
import { ONE_HOUR_MS } from 'lib/utils/numbers';

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

const COINS_TTL_MS = 10 * 60 * 1000;
const PLATFORMS_TTL_MS = 6 * ONE_HOUR_MS;

const PAGES = 2;
const TOP_N = PAGES * 250;

const SUPPLEMENTAL_IDS = ['wrapped-bitcoin', 'weth', 'wrapped-steth', 'coinbase-wrapped-btc'];

const TEZOS_ECOSYSTEM_CATEGORY = 'tezos-ecosystem';

interface CoinsBundle {
  data: CoinsBySymbol;
  sparklinesById: Record<string, number[]>;
}

const fetchTopCoins = async (): Promise<TopCoinRaw[]> => {
  const [primary, supplemental, tezos] = await Promise.all([
    fetchTopCoinsByMarketCap(PAGES),
    fetchCoinsByIds(SUPPLEMENTAL_IDS),
    fetchCoinsByCategory(TEZOS_ECOSYSTEM_CATEGORY)
  ]);

  if (primary.length > 0) {
    return primary.concat(supplemental, tezos);
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
  ttlMs: COINS_TTL_MS,
  fallback: { data: {}, sparklinesById: {} },
  build: buildCoinsBySymbol,
  isValid: ({ data }) => Object.keys(data).length > 0
});

export const getCoinsBySymbol = async (): Promise<CoinsBySymbol> => (await ensureCache()).data;

export const getCoinById = async (id: string): Promise<CoinMetadata | undefined> =>
  Object.values((await ensureCache()).data).find(coin => coin.id === id);

export const getCoinSparkline = async (id: string): Promise<number[]> => (await ensureCache()).sparklinesById[id] ?? [];

export interface PlatformDeployment {
  slug: string;
  address: string;
}

type CoinPlatforms = Record<string, PlatformDeployment[]>;

const ensurePlatforms = persistentCache<CoinPlatforms>({
  storageKey: 'WEB_WIDGETS_COIN_PLATFORMS',
  ttlMs: PLATFORMS_TTL_MS,
  fallback: {},
  build: async () => {
    const [entry, list] = await Promise.all([ensureCache(), fetchCoinsListWithPlatforms()]);
    if (list.length === 0) throw new Error('empty coins/list response');

    const surfaced = new Set(Object.values(entry.data).map(coin => coin.id));
    const byId: CoinPlatforms = {};
    for (const coin of list) {
      if (!coin.platforms || !surfaced.has(coin.id)) continue;
      const deployments = Object.entries(coin.platforms).flatMap(([slug, address]) =>
        address ? [{ slug, address }] : []
      );
      if (deployments.length > 0) byId[coin.id] = deployments;
    }
    return byId;
  }
});

export const getCoinPlatforms = async (coinId: string): Promise<PlatformDeployment[]> => {
  const entry = (await ensurePlatforms())[coinId];
  return Array.isArray(entry) ? entry : [];
};
