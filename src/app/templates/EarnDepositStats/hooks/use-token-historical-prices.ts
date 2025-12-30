import { fetchMarketChartData, type MarketChartData, type MarketChartParams } from 'lib/apis/coingecko';
import { useTypedSWR } from 'lib/swr';

export const useTokenHistoricalPrices = (params: MarketChartParams) =>
  useTypedSWR<MarketChartData>(['token-historical-prices', params], () => fetchMarketChartData(params), {
    revalidateOnFocus: false,
    dedupingInterval: 60_000
  });
