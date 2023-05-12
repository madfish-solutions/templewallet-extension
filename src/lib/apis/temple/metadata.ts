import axios from 'axios';
import memoize from 'mem';

import { IS_DEV_ENV } from 'lib/env';
import { TempleChainId } from 'lib/temple/types';

const LOCAL_METADATA_API_URL = process.env.LOCAL_METADATA_API_URL;

if (LOCAL_METADATA_API_URL) console.warn(`process.env.LOCAL_METADATA_API_URL found. Will use it for metadata loading.`);

const API_CHAIN_NAMES = {
  [TempleChainId.Mainnet]: 'mainnet',
  [TempleChainId.Ghostnet]: 'ghostnet',
  [TempleChainId.Mumbainet]: 'mumbainet',
  [TempleChainId.Dcp]: 'dcp',
  [TempleChainId.DcpTest]: 'dcptest'
};

type MetadataApiChainId = keyof typeof API_CHAIN_NAMES;

const KNOWN_CHAIN_IDS = Object.keys(API_CHAIN_NAMES);

export const isKnownChainId = (chainId: string): chainId is MetadataApiChainId => KNOWN_CHAIN_IDS.includes(chainId);

export interface TokenMetadataResponse {
  decimals: number;
  symbol?: string;
  name?: string;
  thumbnailUri?: string;
  artifactUri?: string;
}

export const fetchOneTokenMetadata = (chainId: MetadataApiChainId, address: string, id = 0) =>
  getApi(chainId)
    .get<TokenMetadataResponse>(`/metadata/${address}/${id}`)
    .then(({ data }) => (data.name === 'Unknown Token' ? undefined : data));

export const fetchTokensMetadata = async (chainId: MetadataApiChainId, slugs: string[]) => {
  if (slugs.length === 0) return [];

  return getApi(chainId)
    .post<(TokenMetadataResponse | null)[]>('/', slugs)
    .then(r => r.data);
};

const getApi = memoize((chainId: MetadataApiChainId) => {
  const baseURL = buildApiUrl(chainId);
  return axios.create({ baseURL });
});

const buildApiUrl = (chainId: string) => {
  if (LOCAL_METADATA_API_URL) return LOCAL_METADATA_API_URL;

  const chainName = API_CHAIN_NAMES[chainId as MetadataApiChainId];

  if (!chainName) throw new Error('Unknown Chain ID to Temple Metadata service');

  if (IS_DEV_ENV) return `https://metadata-api-${chainName}.stage.madfish.xyz`;

  return `https://metadata-api-${chainName}.prod.templewallet.com`;
};
