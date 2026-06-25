import { getCoinSparkline } from './fetch-coins-by-symbol';

export interface ChartPoint {
  timestamp: number;
  value: number;
}

const HOUR_MS = 60 * 60 * 1000;
const HOURS_24 = 24;

export const fetchTokenChart = async (coinId: string): Promise<ChartPoint[]> => {
  const prices = await getCoinSparkline(coinId);
  if (prices.length === 0) return [];

  const recent = prices.slice(-HOURS_24);
  const base = Date.now() - (recent.length - 1) * HOUR_MS;
  return recent.map((value, index) => ({ timestamp: base + index * HOUR_MS, value }));
};
