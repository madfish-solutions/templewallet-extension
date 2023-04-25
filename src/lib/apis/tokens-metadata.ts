import axios from 'axios';

import { EnvVars } from 'lib/env';

const tezosMetadataApi = axios.create({ baseURL: EnvVars.TEMPLE_WALLET_METADATA_API_URL });

export interface TokenMetadataResponse {
  decimals: number;
  symbol?: string;
  name?: string;
  thumbnailUri?: string;
  artifactUri?: string;
}

export const fetchTokenMetadata = (address: string, id = 0) =>
  tezosMetadataApi.get<TokenMetadataResponse>(`/metadata/${address}/${id}`);

export const fetchTokensMetadata = (slugs: string[]) =>
  tezosMetadataApi.post<(TokenMetadataResponse | null)[]>('/', slugs);
