import { fetchHistoricalUsdPrices } from 'lib/apis/coinpaprika';
import { useTypedSWR } from 'lib/swr';

interface MarketChartData {
  prices: Array<[number, number]>;
}

export const useTokenHistoricalPrices = (coinId: string, days: number) =>
  useTypedSWR<MarketChartData>(
    ['token-historical-prices', coinId, days],
    async () => ({
      prices: (await fetchHistoricalUsdPrices(coinId, days)).map((point): [number, number] => [
        point.timestamp,
        point.price
      ])
    }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000
    }
  );
