import axios from 'axios';

import { EnvVars } from 'lib/env';

const api = axios.create({ baseURL: EnvVars.TEMPLE_WALLET_METADATA_API_URL });

export interface TokenMetadataResponse {
  decimals: number;
  symbol?: string;
  name?: string;
  thumbnailUri?: string;
  artifactUri?: string;
}

export const fetchOneTokenMetadata = (rpcUrl: string, address: string, id = 0) =>
  api
    .get<TokenMetadataResponse>(`/metadata/${address}/${id}`, { params: { rpcUrl } })
    .then(({ data }) => (data.name === 'Unknown Token' ? undefined : data));

export const fetchTokensMetadata = async (rpcUrl: string, slugs: string[]) => {
  if (slugs.length === 0) return [];
  return api.post<(TokenMetadataResponse | null)[]>('/', slugs, { params: { rpcUrl } }).then(r => r.data);
};
