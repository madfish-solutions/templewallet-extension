import { createAPI } from 'lib/axios';
import { TempleChainId } from 'lib/temple/types';

interface TokenListItem {
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
  keywords: Array<string>;
  logoURI: string;
  name: string;
  timestamp: string;
  tokens?: Array<TokenListItem>;
  version: {
    major: number;
    minor: number;
    patch: number;
  };
}

const WHITELIST_TOKENS_BASE_URL = 'https://raw.githubusercontent.com/madfish-solutions/tokens-whitelist/master/';

const api = createAPI({ baseURL: WHITELIST_TOKENS_BASE_URL });

export const fetchWhitelistTokenSlugs = (chainId: string) =>
  api
    .get<WhitelistResponse>('tokens/quipuswap.whitelist.json')
    .then(response =>
      response.data.tokens && chainId === TempleChainId.Mainnet
        ? response.data.tokens
            .map(token =>
              token.contractAddress === 'tez' ? 'tez' : `${token.contractAddress}_${token.fa2TokenId ?? 0}`
            )
            .filter(x => x !== 'tez')
        : []
    );
