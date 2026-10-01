import {
  fetchActiveTickers,
  fetchCoinLogo,
  fetchPlatformContracts,
  type PaprikaContract,
  type TopCoinRaw
} from 'lib/apis/coinpaprika';
import { CONTRACT_MARKET_PLATFORMS, TEZOS_PAPRIKA_PLATFORM_ID } from 'lib/apis/market-platforms';
import { fetchFromStorage, putToStorage } from 'lib/storage';
import { ONE_HOUR_MS } from 'lib/utils/numbers';

import { persistentCache } from './persistent-cache';

export interface CoinMetadata {
  symbol: string;
  name: string;
  marketCap: number;
  id: string;
  price: number | null;
  change24h: number | null;
  fdv: number | null;
  volume: number | null;
}

export type CoinsBySymbol = Record<string, CoinMetadata>;

const COINS_TTL_MS = 10 * 60 * 1000;
const PLATFORMS_TTL_MS = 6 * ONE_HOUR_MS;

const TOP_N = 500;

const SUPPLEMENTAL_IDS = ['wbtc-wrapped-bitcoin', 'weth-weth', 'cbbtc-coinbase-wrapped-btc'];

export interface PlatformDeployment {
  slug: string;
  address: string;
}

type CoinPlatforms = Record<string, PlatformDeployment[]>;

const fetchListedCoins = async (): Promise<TopCoinRaw[]> => {
  const [tickers, tezosContracts] = await Promise.all([
    fetchActiveTickers(),
    fetchPlatformContracts(TEZOS_PAPRIKA_PLATFORM_ID).catch((): PaprikaContract[] => [])
  ]);

  const extraIds = new Set([
    ...SUPPLEMENTAL_IDS,
    ...tezosContracts.flatMap(contract => (contract.active ? [contract.id] : []))
  ]);
  const top = tickers.slice(0, TOP_N);
  const included = new Set(top.map(coin => coin.id));

  return top.concat(tickers.filter(coin => extraIds.has(coin.id) && !included.has(coin.id)));
};

const buildCoinsBySymbol = async (): Promise<CoinsBySymbol> => {
  const coins = await fetchListedCoins();
  const bySymbol: CoinsBySymbol = {};

  for (const coin of coins) {
    const key = coin.symbol.toUpperCase();
    const marketCap = coin.market_cap ?? 0;
    const existing = bySymbol[key];
    if (!existing || marketCap > existing.marketCap) {
      bySymbol[key] = {
        symbol: key,
        name: coin.name,
        marketCap,
        id: coin.id,
        price: coin.current_price ?? null,
        change24h: coin.price_change_percentage_24h ?? null,
        fdv: coin.fully_diluted_valuation ?? null,
        volume: coin.total_volume ?? null
      };
    }
  }

  return bySymbol;
};

const ensureCache = persistentCache<CoinsBySymbol>({
  storageKey: 'WEB_WIDGETS_COINS_BY_SYMBOL_V2',
  ttlMs: COINS_TTL_MS,
  fallback: {},
  build: buildCoinsBySymbol,
  isValid: data => Object.keys(data).length > 0
});

export const getCoinsBySymbol = (): Promise<CoinsBySymbol> => ensureCache();

export const getCoinById = async (id: string): Promise<CoinMetadata | undefined> =>
  Object.values(await ensureCache()).find(coin => coin.id === id);

const ensurePlatforms = persistentCache<CoinPlatforms>({
  storageKey: 'WEB_WIDGETS_COIN_PLATFORMS_V2',
  ttlMs: PLATFORMS_TTL_MS,
  fallback: {},
  build: async () => {
    const [coins, lists] = await Promise.all([
      ensureCache(),
      Promise.all(
        CONTRACT_MARKET_PLATFORMS.map(platform =>
          fetchPlatformContracts(platform.paprikaPlatformId)
            .then(contracts => ({ platform, contracts }))
            .catch(() => null)
        )
      )
    ]);
    if (lists.every(list => list == null)) throw new Error('contract platforms unavailable');

    const surfaced = new Set(Object.values(coins).map(coin => coin.id));
    const seen = new Set<string>();
    const byId: CoinPlatforms = {};

    for (const list of lists) {
      if (!list) continue;

      for (const contract of list.contracts) {
        if (!contract.active || !contract.address || !surfaced.has(contract.id)) continue;

        const key = `${contract.id}:${list.platform.slug}:${contract.address.toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const deployments = byId[contract.id] ?? [];
        deployments.push({ slug: list.platform.slug, address: contract.address });
        byId[contract.id] = deployments;
      }
    }

    return byId;
  }
});

const LOGOS_TTL_MS = 7 * 24 * ONE_HOUR_MS;
const LOGOS_STORAGE_KEY = 'WEB_WIDGETS_COIN_LOGOS_V1';

interface StoredLogo {
  url: string;
  fetchedAt: number;
}

let storedLogosPromise: Promise<Record<string, StoredLogo>> | null = null;
const logoRequests = new Map<string, Promise<string>>();

const readStoredLogos = () => {
  storedLogosPromise ??= fetchFromStorage<Record<string, StoredLogo>>(LOGOS_STORAGE_KEY)
    .catch((): Record<string, StoredLogo> | null => null)
    .then(persisted => persisted ?? {});

  return storedLogosPromise;
};

const loadCoinLogo = async (coinId: string): Promise<string> => {
  const logos = await readStoredLogos();
  const cached = logos[coinId];
  if (cached && Date.now() - cached.fetchedAt <= LOGOS_TTL_MS) return cached.url;

  try {
    const url = await fetchCoinLogo(coinId);
    logos[coinId] = { url, fetchedAt: Date.now() };
    putToStorage(LOGOS_STORAGE_KEY, logos).catch(() => {});
    return url;
  } catch {
    return cached?.url ?? '';
  }
};

/** Logo from Coinpaprika Get coin by ID, including its per-coin `rev` when the API sends one. */
export const getCoinLogo = (coinId: string): Promise<string> => {
  const pending = logoRequests.get(coinId);
  if (pending) return pending;

  const request = loadCoinLogo(coinId).finally(() => {
    logoRequests.delete(coinId);
  });
  logoRequests.set(coinId, request);
  return request;
};

export const getCoinPlatforms = async (coinId: string): Promise<PlatformDeployment[]> => {
  const entry = (await ensurePlatforms())[coinId];
  return Array.isArray(entry) ? entry : [];
};
