import axios from 'axios';

import type { DetailedAssetMetdata } from 'lib/temple/metadata/types';

const api = axios.create({ baseURL: 'https://metadata.templewallet.com' });

export async function getTokensMetadata(slugs: string[], timeout?: number) {
  if (slugs.length === 0) return [];
  return api.post<(DetailedAssetMetdata | null)[]>('/', slugs, { timeout }).then(r => r.data);
}
