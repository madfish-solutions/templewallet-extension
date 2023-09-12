import { isDefined } from '@rnw-community/shared';
import { TezosToolkit } from '@taquito/taquito';
import { pick } from 'lodash';
import memoize from 'mem';
import { from, Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';

import {
  TokenMetadataResponse,
  fetchOneTokenMetadata as fetchOneTokenMetadataOnAPI,
  fetchTokensMetadata as fetchTokensMetadataOnAPI,
  WhitelistResponseToken,
  fetchWhitelistTokens$,
  isKnownChainId
} from 'lib/apis/temple';
import { tokenToSlug } from 'lib/assets';

import { TokenMetadataOnChain, fetchTokenMetadata as fetchTokenMetadataOnChain } from './on-chain';
import { TokenMetadata, TokenStandardsEnum } from './types';
import { buildTokenMetadataFromFetched } from './utils';

export const fetchOneTokenMetadata = async (
  rpcUrl: string,
  address: string,
  id: number = 0
): Promise<TokenMetadataResponse | undefined> => {
  const tezos = new TezosToolkit(rpcUrl);
  const chainId = await tezos.rpc.getChainId();

  if (isKnownChainId(chainId)) {
    return await fetchOneTokenMetadataOnAPI(chainId, address, id);
  }

  const metadataOnChain = await fetchTokenMetadataOnChain(tezos, address, id);

  return chainTokenMetadataToBase(metadataOnChain) || undefined;
};

export const fetchTokensMetadata = async (
  rpcUrl: string,
  slugs: string[]
): Promise<(TokenMetadataResponse | null)[]> => {
  if (slugs.length === 0) return [];

  const tezos = new TezosToolkit(rpcUrl);
  const chainId = await tezos.rpc.getChainId();

  if (isKnownChainId(chainId)) {
    return await fetchTokensMetadataOnAPI(chainId, slugs);
  }

  return await Promise.all(
    slugs.map(async slug => {
      const [address, id = 0] = slug.split('_');

      return await fetchTokenMetadataOnChain(tezos, address, id)
        .then(chainTokenMetadataToBase)
        .catch(error => {
          console.error('Fetching metadata on chain error:', error);

          return null;
        });
    })
  );
};

const chainTokenMetadataToBase = (metadata: TokenMetadataOnChain | nullish): TokenMetadataResponse | null =>
  metadata ? pick(metadata, 'name', 'symbol', 'decimals', 'thumbnailUri', 'displayUri', 'artifactUri') : null;

export const loadOneTokenMetadata$ = memoize(
  (rpcUrl: string, address: string, id = 0): Observable<TokenMetadata> =>
    from(fetchOneTokenMetadata(rpcUrl, address, id)).pipe(
      map(data => buildTokenMetadataFromFetched(data, address, id)),
      filter(isDefined)
    ),
  { cacheKey: ([rpcUrl, address, id]) => `${rpcUrl}/${tokenToSlug({ address, id })}` }
);

export const loadTokensMetadata$ = (rpcUrl: string, slugs: string[]): Observable<TokenMetadata[]> =>
  from(fetchTokensMetadata(rpcUrl, slugs)).pipe(
    map(data =>
      data.map((token, index) => {
        const [address, id] = slugs[index].split('_');

        return buildTokenMetadataFromFetched(token, address, Number(id));
      })
    ),
    map(data => data.filter(isDefined))
  );

export const loadWhitelist$ = (): Observable<TokenMetadata[]> =>
  fetchWhitelistTokens$().pipe(
    map(tokens =>
      tokens.map(token => transformWhitelistToTokenMetadata(token, token.contractAddress, token.fa2TokenId ?? 0))
    )
  );

const transformWhitelistToTokenMetadata = (
  token: WhitelistResponseToken,
  address: string,
  id: number
): TokenMetadata => ({
  id,
  address,
  decimals: token.metadata.decimals,
  symbol: token.metadata.symbol ?? token.metadata.name?.substring(0, 8) ?? '???',
  name: token.metadata.name ?? token.metadata.symbol ?? 'Unknown Token',
  thumbnailUri: token.metadata.thumbnailUri,
  standard: token.type === 'FA12' ? TokenStandardsEnum.Fa12 : TokenStandardsEnum.Fa2
});
