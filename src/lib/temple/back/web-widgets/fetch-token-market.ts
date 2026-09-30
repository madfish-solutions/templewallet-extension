import { fetchHistoricalUsdPrices } from 'lib/apis/coinpaprika';

export interface ChartPoint {
  timestamp: number;
  value: number;
}

const CHART_DAYS = 1;

export const fetchTokenChart = async (coinId: string): Promise<ChartPoint[]> => {
  const prices = await fetchHistoricalUsdPrices(coinId, CHART_DAYS, '1h');
  return prices.map(point => ({ timestamp: point.timestamp, value: point.price }));
};
