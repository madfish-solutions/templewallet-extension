import { isDefined } from '@rnw-community/shared';
import type { TezosToolkit } from '@taquito/taquito';
import { pick } from 'lodash';
import memoize from 'mem';
import { of, from, Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';

import {
  TokenMetadataResponse,
  fetchTokenMetadata as fetchTokenMetadataOnAPI,
  fetchTokensMetadata as fetchTokensMetadataOnAPI,
  WhitelistResponseToken,
  fetchWhitelistTokens$
} from 'lib/apis/temple';
import { tokenToSlug } from 'lib/assets';
import { isDcpNode } from 'lib/temple/networks';
import { TempleChainId } from 'lib/temple/types';

import { fetchTokenMetadata as fetchTokenMetadataOnChain, TokenMetadataOnChainResponse } from './on-chain';
import { TokenMetadata, TokenStandardsEnum } from './types';

export const fetchTokenMetadata = async (
  tezos: TezosToolkit,
  address: string,
  id: number = 0
): Promise<TokenMetadataResponse | undefined> => {
  const chainId = await tezos.rpc.getChainId();
  const isMainnet = chainId === TempleChainId.Mainnet;

  if (isMainnet) {
    return await fetchTokenMetadataOnAPI(address, id);
  }

  const metadataOnChain = await fetchTokenMetadataOnChain(tezos, address, id);

  return chainTokenMetadataToBase(metadataOnChain) || undefined;
};

export const fetchTokensMetadata = async (
  tezos: TezosToolkit,
  slugs: string[]
): Promise<(TokenMetadataResponse | null)[]> => {
  if (slugs.length === 0) return [];

  const chainId = await tezos.rpc.getChainId();
  const isMainnet = chainId === TempleChainId.Mainnet;

  if (isMainnet) {
    return await fetchTokensMetadataOnAPI(slugs);
  }

  return await Promise.all(
    slugs.map(slug => {
      const [address, id = '0'] = slug.split('_');
      return fetchTokenMetadataOnChain(tezos, address, Number(id)).then(chainTokenMetadataToBase);
    })
  );
};

const chainTokenMetadataToBase = (metadata: TokenMetadataOnChainResponse | nullish): TokenMetadataResponse | null =>
  metadata ? pick(metadata.base, 'name', 'symbol', 'decimals', 'thumbnailUri', 'artifactUri') : null;

export const loadTokenMetadata$ = memoize(
  (tezos: TezosToolkit, address: string, id = 0): Observable<TokenMetadata> => {
    const slug = `${address}_${id}`;
    console.log('Loading metadata for:', slug);

    return from(fetchTokenMetadata(tezos, address, id)).pipe(
      map(data => transformDataToTokenMetadata(data, address, id)),
      filter(isDefined)
    );
  },
  { cacheKey: ([, address, id]) => tokenToSlug({ address, id }) }
);

export const loadTokensMetadata$ = memoize(
  (tezos: TezosToolkit, slugs: string[]): Observable<TokenMetadata[]> =>
    from(fetchTokensMetadata(tezos, slugs)).pipe(
      map(data =>
        data
          .map((token, index) => {
            const [address, id] = slugs[index].split('_');

            return transformDataToTokenMetadata(token, address, Number(id));
          })
          .filter(isDefined)
      )
    )
);

const transformDataToTokenMetadata = (
  token: TokenMetadataResponse | nullish,
  address: string,
  id: number
): TokenMetadata | null =>
  !isDefined(token)
    ? null
    : {
        id,
        address,
        decimals: token.decimals,
        symbol: token.symbol ?? token.name?.substring(0, 8) ?? '???',
        name: token.name ?? token.symbol ?? 'Unknown Token',
        thumbnailUri: token.thumbnailUri,
        artifactUri: token.artifactUri
      };

export const loadWhitelist$ = (selectedRpc: string): Observable<TokenMetadata[]> =>
  isDcpNode(selectedRpc)
    ? of([])
    : fetchWhitelistTokens$().pipe(
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
