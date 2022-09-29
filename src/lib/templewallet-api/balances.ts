import { createAPI } from 'lib/axios';

const api = createAPI({ baseURL: 'https://balance.templewallet.com' });

export async function getAssetBalances(data: { account: string; assetSlugs: string[] }) {
  return api.post<string[]>('/', data).then(r => r.data);
}
