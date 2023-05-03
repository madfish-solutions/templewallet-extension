import { isDefined } from '@rnw-community/shared';
import { TezosToolkit } from '@taquito/taquito';
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

import { TokenMetadataOnChain, fetchTokenMetadata as fetchTokenMetadataOnChain } from './on-chain';
import { TokenMetadata, TokenStandardsEnum } from './types';

export const fetchOneTokenMetadata = async (
  rpcUrl: string,
  address: string,
  id: number = 0
): Promise<TokenMetadataResponse | undefined> => {
  const tezos = new TezosToolkit(rpcUrl);
  const chainId = await tezos.rpc.getChainId();
  const isMainnet = chainId === TempleChainId.Mainnet;

  if (isMainnet) {
    return await fetchTokenMetadataOnAPI(address, id);
  }

  const metadataOnChain = await fetchTokenMetadataOnChain(tezos, address, id);

  return chainTokenMetadataToBase(metadataOnChain) || undefined;
};

const fetchTokensMetadata = async (rpcUrl: string, slugs: string[]): Promise<(TokenMetadataResponse | null)[]> => {
  if (slugs.length === 0) return [];

  const tezos = new TezosToolkit(rpcUrl);
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

const chainTokenMetadataToBase = (metadata: TokenMetadataOnChain | nullish): TokenMetadataResponse | null =>
  metadata ? pick(metadata, 'name', 'symbol', 'decimals', 'thumbnailUri', 'artifactUri') : null;

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

const buildTokenMetadataFromFetched = (
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
