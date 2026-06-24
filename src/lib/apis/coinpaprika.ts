import axios from 'axios';

import type { TopCoinRaw } from './coingecko';

const coinpaprikaApi = axios.create({ baseURL: 'https://api.coinpaprika.com/v1/' });

interface PaprikaTickerRaw {
  id: string;
  name: string;
  symbol: string;
  rank: number;
  quotes?: { USD?: { market_cap: number | null } };
}

export async function fetchTopCoinsFromPaprika(limit: number): Promise<TopCoinRaw[]> {
  const { data } = await coinpaprikaApi.get<PaprikaTickerRaw[]>('tickers', { params: { quotes: 'USD' } });

  return data
    .filter(coin => coin.rank > 0)
    .toSorted((a, b) => a.rank - b.rank)
    .slice(0, limit)
    .map(coin => ({
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      image: `https://static.coinpaprika.com/coin/${coin.id}/logo.png`,
      market_cap: coin.quotes?.USD?.market_cap ?? null
    }));
}
