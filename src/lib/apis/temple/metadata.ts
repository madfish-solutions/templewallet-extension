import axios from 'axios';

import { EnvVars } from 'lib/env';
import { DetailedAssetMetdata } from 'lib/temple/metadata';

const api = axios.create({ baseURL: EnvVars.TEMPLE_WALLET_METADATA_API_URL });

export async function getTokensMetadata(slugs: string[], timeout?: number) {
  if (slugs.length === 0) return [];
  return api.post<(DetailedAssetMetdata | null)[]>('/', slugs, { timeout }).then(r => r.data);
}
