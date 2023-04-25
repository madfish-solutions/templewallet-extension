import axios from 'axios';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';

const whitelistApi = axios.create({
  baseURL: 'https://raw.githubusercontent.com/madfish-solutions/tokens-whitelist/master/'
});

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

export const fetchWhitelistTokens$ = () =>
  from(whitelistApi.get<WhitelistResponse>('tokens/quipuswap.whitelist.json')).pipe(
    map(({ data }) => data.tokens?.filter(x => x.contractAddress !== 'tez') ?? [])
  );
