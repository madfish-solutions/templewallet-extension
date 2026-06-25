import axios from 'axios';

import type { TopCoinRaw } from './coingecko';

const coinpaprikaApi = axios.create({ baseURL: 'https://api.coinpaprika.com/v1/' });

interface PaprikaQuoteUSD {
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
  quotes?: { USD?: PaprikaQuoteUSD };
}

export async function fetchTopCoinsFromPaprika(limit: number): Promise<TopCoinRaw[]> {
  const { data } = await coinpaprikaApi.get<PaprikaTickerRaw[]>('tickers', { params: { quotes: 'USD' } });

  return data
    .filter(coin => coin.rank > 0)
    .toSorted((a, b) => a.rank - b.rank)
    .slice(0, limit)
    .map(coin => {
      const usd = coin.quotes?.USD;
      const price = usd?.price ?? null;
      const maxSupply = coin.max_supply ?? 0;
      return {
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        image: `https://static.coinpaprika.com/coin/${coin.id}/logo.png`,
        market_cap: usd?.market_cap ?? null,
        current_price: price,
        price_change_percentage_24h: usd?.percent_change_24h ?? null,
        // Coinpaprika has no FDV field, derive it from price × max supply
        fully_diluted_valuation: price != null && maxSupply > 0 ? price * maxSupply : null,
        total_volume: usd?.volume_24h ?? null,
        high_24h: null,
        low_24h: null
      };
    });
}
