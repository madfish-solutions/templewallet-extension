import { fetchCoinsByIds, fetchTopCoinsByMarketCap, type TopCoinRaw } from 'lib/apis/coingecko';
import { fetchTopCoinsFromPaprika } from 'lib/apis/coinpaprika';

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
const TTL_MS = 10 * 60 * 1000;
const FAILURE_BACKOFF_MS = 30 * 1000;

const SUPPLEMENTAL_IDS = ['wrapped-bitcoin', 'weth', 'wrapped-steth', 'coinbase-wrapped-btc'];

interface CacheEntry {
  data: CoinsBySymbol;
  sparklinesById: Record<string, number[]>;
  builtAt: number;
}

const EMPTY: CacheEntry = { data: {}, sparklinesById: {}, builtAt: 0 };

let cache: CacheEntry | null = null;
let lastFailureAt = 0;

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

const buildCoinsBySymbol = async (): Promise<{ data: CoinsBySymbol; sparklinesById: Record<string, number[]> }> => {
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

const ensureCache = async (): Promise<CacheEntry> => {
  if (cache && Date.now() - cache.builtAt <= TTL_MS) {
    return cache;
  }

  if (Date.now() - lastFailureAt < FAILURE_BACKOFF_MS) {
    return cache ?? EMPTY;
  }

  try {
    const built = await buildCoinsBySymbol();
    if (Object.keys(built.data).length === 0) {
      lastFailureAt = Date.now();
      return cache ?? EMPTY;
    }
    cache = { ...built, builtAt: Date.now() };
    return cache;
  } catch {
    lastFailureAt = Date.now();
    return cache ?? EMPTY;
  }
};

export const getCoinsBySymbol = async (): Promise<CoinsBySymbol> => (await ensureCache()).data;

export const getCoinSparkline = async (id: string): Promise<number[]> => (await ensureCache()).sparklinesById[id] ?? [];
