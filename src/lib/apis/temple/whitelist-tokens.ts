import axios from 'axios';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';

export interface WhitelistResponseToken {
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

export const fetchWhitelistTokens$ = () =>
  from(
    api.get<WhitelistResponse>('tokens/quipuswap.whitelist.json').catch(error => {
      console.error(error);
      throw error;
    })
  ).pipe(map(({ data }) => data.tokens?.filter(x => x.contractAddress !== 'tez') ?? []));
