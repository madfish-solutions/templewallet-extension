import axios from 'axios';

const coinpaprikaApi = axios.create({ baseURL: 'https://api.coinpaprika.com/v1/' });

interface PaprikaQuote {
  price?: number | null;
  volume_24h?: number | null;
  market_cap?: number | null;
  percent_change_24h?: number | null;
}

interface PaprikaTickerRaw {
  id: string;
  name: string;
  symbol: string;
  rank: number;
  max_supply?: number | null;
  total_supply?: number | null;
  quotes?: Record<string, PaprikaQuote | undefined>;
}

interface PaprikaHistoricalTick {
  timestamp: string;
  price?: number | null;
}

interface PaprikaCoin {
  logo?: string | null;
}

export interface PaprikaContract {
  address: string;
  id: string;
  active: boolean;
}

export interface TopCoinRaw {
  id: string;
  symbol: string;
  name: string;
  market_cap: number | null;
  current_price: number | null;
  price_change_percentage_24h: number | null;
  fully_diluted_valuation: number | null;
  total_volume: number | null;
}

interface HistoricalPricePoint {
  timestamp: number;
  price: number;
}

const isNotFound = (error: unknown) => axios.isAxiosError(error) && error.response?.status === 404;

const mapTicker = (coin: PaprikaTickerRaw): TopCoinRaw => {
  const usd = coin.quotes?.USD;
  const price = usd?.price ?? null;
  // Coinpaprika reports max_supply: 0 for uncapped coins (e.g. stablecoins)
  const fdvSupply = coin.max_supply || coin.total_supply || 0;

  return {
    id: coin.id,
    symbol: coin.symbol,
    name: coin.name,
    market_cap: usd?.market_cap ?? null,
    current_price: price,
    price_change_percentage_24h: usd?.percent_change_24h ?? null,
    fully_diluted_valuation: price != null && fdvSupply > 0 ? price * fdvSupply : null,
    total_volume: usd?.volume_24h ?? null
  };
};

export async function fetchActiveTickers(): Promise<TopCoinRaw[]> {
  const { data } = await coinpaprikaApi.get<PaprikaTickerRaw[]>('tickers', { params: { quotes: 'USD' } });

  return data
    .filter(coin => coin.rank > 0)
    .toSorted((a, b) => a.rank - b.rank)
    .map(mapTicker);
}

export async function fetchTickerUsdVolume(coinId: string): Promise<number | null> {
  try {
    const { data } = await coinpaprikaApi.get<PaprikaTickerRaw>(`tickers/${coinId}`, { params: { quotes: 'USD' } });
    return data.quotes?.USD?.volume_24h ?? null;
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

/** `undefined` when the contract is not listed on that platform. */
export async function fetchContractUsdVolume(platformId: string, address: string): Promise<number | null | undefined> {
  try {
    const { data } = await coinpaprikaApi.get<PaprikaTickerRaw>(
      `contracts/${encodeURIComponent(platformId)}/${encodeURIComponent(address)}`,
      { params: { quotes: 'USD' } }
    );
    return data.quotes?.USD?.volume_24h ?? null;
  } catch (error) {
    if (isNotFound(error)) return undefined;
    throw error;
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;
// A start of exactly 24h ago is rejected on the free plan ("last 1 day" is exclusive).
const HOURLY_LOOKBACK_MS = 23 * 60 * 60 * 1000;

/**
 * Daily history covers the past year on the free plan.
 * Hourly history covers the past day. Prices are in USD.
 */
export async function fetchHistoricalUsdPrices(
  coinId: string,
  days: number,
  interval: '1h' | '1d' = '1d'
): Promise<HistoricalPricePoint[]> {
  const start = new Date(Date.now() - (interval === '1h' ? HOURLY_LOOKBACK_MS : days * DAY_MS)).toISOString();
  const limit = interval === '1h' ? 24 : days + 1;
  const { data } = await coinpaprikaApi.get<PaprikaHistoricalTick[]>(`tickers/${coinId}/historical`, {
    params: { start, interval, limit }
  });

  return data.flatMap(tick => {
    const timestamp = Date.parse(tick.timestamp);
    if (!Number.isFinite(timestamp) || typeof tick.price !== 'number') return [];
    return [{ timestamp, price: tick.price }];
  });
}

/** Logo URL from Get coin by ID. Empty when the coin has no logo. */
export async function fetchCoinLogo(coinId: string): Promise<string> {
  try {
    const { data } = await coinpaprikaApi.get<PaprikaCoin>(`coins/${encodeURIComponent(coinId)}`);
    return typeof data.logo === 'string' ? data.logo : '';
  } catch (error) {
    if (isNotFound(error)) return '';
    throw error;
  }
}

export const fetchPlatformContracts = (platformId: string) =>
  coinpaprikaApi.get<PaprikaContract[]>(`contracts/${platformId}`).then(({ data }) => data);
