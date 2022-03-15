import axios from 'axios';

import { DetailedAssetMetdata } from 'lib/temple/metadata';

const api = axios.create({ baseURL: 'https://metadata.templewallet.com' });

export async function getTokensMetadata(slugs: string[], timeout?: number) {
  if (slugs.length === 0) return [];
  return api.post<(DetailedAssetMetdata | null)[]>('/', slugs, { timeout }).then(r => r.data);
}
