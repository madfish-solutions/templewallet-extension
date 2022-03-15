import axios from 'axios';

const api = axios.create({ baseURL: 'https://balance.templewallet.com' });

export async function getAssetBalances(data: { account: string; assetSlugs: string[] }) {
  return api.post<string[]>('/', data).then(r => r.data);
}
