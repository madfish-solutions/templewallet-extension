import axios from 'axios';

import { DetailedAssetMetdata } from 'lib/temple/metadata';

const TEMPLE_WALLET_METADATA_API_URL = process.env.TEMPLE_WALLET_METADATA_API_URL;

if (!TEMPLE_WALLET_METADATA_API_URL) {
  throw new Error('process.env.TEMPLE_WALLET_METADATA_API_URL is not defined');
}

const api = axios.create({ baseURL: TEMPLE_WALLET_METADATA_API_URL });

export async function getTokensMetadata(slugs: string[], timeout?: number) {
  if (slugs.length === 0) return [];
  return api.post<(DetailedAssetMetdata | null)[]>('/', slugs, { timeout }).then(r => r.data);
}
