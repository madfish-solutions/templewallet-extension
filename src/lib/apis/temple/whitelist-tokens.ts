import axios from 'axios';

export interface WhitelistResponseToken {
  contractAddress: 'tez' | string;
  fa2TokenId?: number;
  network: 'mainnet' | string;
  metadata: WhitelistResponseMetadata;
  type: 'FA2' | 'FA12';
}

interface WhitelistResponseMetadata {
  decimals: number;
  name: string;
  symbol: string;
  thumbnailUri?: string;
  description?: string;
}

interface WhitelistResponse {
  keywords: string[];
  logoURI: string;
  name: string;
  timestamp: string;
  tokens?: WhitelistResponseToken[];
  version: {
    major: number;
    minor: number;
    patch: number;
  };
}

const WHITELIST_TOKENS_BASE_URL = 'https://raw.githubusercontent.com/madfish-solutions/tokens-whitelist/master/';

const api = axios.create({ baseURL: WHITELIST_TOKENS_BASE_URL });

export const fetchWhitelistTokens = () =>
  api.get<WhitelistResponse>('tokens/quipuswap.whitelist.json').then(
    ({ data }) => data.tokens ?? [],
    error => {
      console.error(error);
      throw error;
    }
  );
