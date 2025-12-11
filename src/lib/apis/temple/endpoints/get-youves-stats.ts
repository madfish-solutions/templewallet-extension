import { templeWalletApi } from './templewallet.api';

export interface YouvesStatsResponse {
  apr: StringRecord<number | Record<'v2' | 'v3', number>>;
}

export const getYouvesStats = async () => {
  const response = await templeWalletApi.get<YouvesStatsResponse>('/youves/stats');

  return response.data;
};
