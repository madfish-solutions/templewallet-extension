import { isDefined } from '@rnw-community/shared';
import memoize from 'mem';
import { of, from, Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';

import { fetchTokenMetadata, fetchTokensMetadata, TokenMetadataResponse } from 'lib/apis/tokens-metadata';
import { WhitelistResponseToken, fetchWhitelistTokens$ } from 'lib/apis/whitelist';
import { tokenToSlug } from 'lib/temple/assets';
import { isDcpNode } from 'lib/temple/networks';

export enum TokenStandardsEnum {
  Fa2 = 'fa2',
  Fa12 = 'fa12'
}
export interface TokenMetadataInterface {
  id: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  // iconName?: IconNameEnum;
  thumbnailUri?: string;
  displayUri?: string;
  artifactUri?: string;
  standard?: TokenStandardsEnum | null;

  /** Stored as separate Record */
  // exchangeRate?: number;
}

export const mockFA1_2TokenMetadata: TokenMetadataInterface = {
  id: 0,
  address: 'fa12TokenAddress',
  name: 'Mock FA1.2 token',
  symbol: 'MOCK12',
  decimals: 6,
  thumbnailUri: 'https://fakeurl.com/img.png'
};

export const mockFA2TokenMetadata: TokenMetadataInterface = {
  id: 2,
  address: 'fa2TokenAddress',
  name: 'Mock FA2 token',
  symbol: 'MOCK2',
  decimals: 8,
  thumbnailUri: 'https://fakeurl.com/img2.png'
};

export const loadTokenMetadata$ = memoize(
  (address: string, id = 0): Observable<TokenMetadataInterface> => {
    const slug = `${address}_${id}`;
    console.log('Loading metadata for:', slug);

    return from(fetchTokenMetadata(address, id)).pipe(
      map(({ data }) => transformDataToTokenMetadata(data, address, id)),
      filter(isDefined)
    );
  },
  { cacheKey: ([address, id]) => tokenToSlug({ address, id }) }
);

export const loadTokensMetadata$ = memoize(
  (slugs: string[]): Observable<TokenMetadataInterface[]> =>
    from(fetchTokensMetadata(slugs)).pipe(
      map(({ data }) =>
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
  token: TokenMetadataResponse | null,
  address: string,
  id: number
): TokenMetadataInterface | null =>
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

const transformWhitelistToTokenMetadata = (
  token: WhitelistResponseToken,
  address: string,
  id: number
): TokenMetadataInterface => ({
  id,
  address,
  decimals: token.metadata.decimals,
  symbol: token.metadata.symbol ?? token.metadata.name?.substring(0, 8) ?? '???',
  name: token.metadata.name ?? token.metadata.symbol ?? 'Unknown Token',
  thumbnailUri: token.metadata.thumbnailUri,
  standard: token.type === 'FA12' ? TokenStandardsEnum.Fa12 : TokenStandardsEnum.Fa2
});

export const loadWhitelist$ = (selectedRpc: string): Observable<TokenMetadataInterface[]> =>
  isDcpNode(selectedRpc)
    ? of([])
    : fetchWhitelistTokens$().pipe(
        map(tokens =>
          tokens.map(token => transformWhitelistToTokenMetadata(token, token.contractAddress, token.fa2TokenId ?? 0))
        )
      );
