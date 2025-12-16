//import { templeWalletApi } from './templewallet.api';
import axios from 'axios';

//* https://docs.coingecko.com/reference/coins-id-market-chart */
export interface MarketChartParams {
  id: string;
  vs_currency?: string;
  days?: string;
  interval?: '5m' | 'hourly' | 'daily';
  precision?:
    | 'full'
    | '0'
    | '1'
    | '2'
    | '3'
    | '4'
    | '5'
    | '6'
    | '7'
    | '8'
    | '9'
    | '10'
    | '11'
    | '12'
    | '13'
    | '14'
    | '15'
    | '16'
    | '17'
    | '18';
}

export interface MarketChartData {
  prices: number[][];
  market_caps: number[][];
  total_volumes: number[][];
}

// TODO: rm
const templeWalletApi = axios.create({
  baseURL: 'http://localhost:3000/api',
  adapter: 'fetch'
});

export const fetchMarketChartData = async (params: MarketChartParams) => {
  const { data } = await templeWalletApi.get<MarketChartData>('/historical-chart-data', { params });

  return data;
};
