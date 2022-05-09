import axios from 'axios';

const TOKENLIST_BASE_URL = 'https://raw.githubusercontent.com/madfish-solutions/tokens-whitelist/master/';

export interface TokenListItem {
  contractAddress: 'tez' | string;
  fa2TokenId?: number;
  network: 'mainnet' | string;
  metadata: {
    decimals: number;
    name: string;
    symbol: string;
    thumbnailUri?: string;
  };
  type: 'FA2' | 'FA12';
}

interface TokenListResponse {
  keywords: Array<string>;
  logoURI: string;
  name: string;
  timestamp: string;
  tokens: Array<TokenListItem>;
  version: {
    major: number;
    minor: number;
    patch: number;
  };
}

const api = axios.create({ baseURL: TOKENLIST_BASE_URL });

export async function getQuipuWhitelist(): Promise<TokenListResponse> {
  return api.get('tokens/quipuswap.whitelist.json').then(r => r.data);
}
