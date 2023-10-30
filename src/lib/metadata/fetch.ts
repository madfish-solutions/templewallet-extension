import { TezosToolkit } from '@taquito/taquito';
import { pick } from 'lodash';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  TokenMetadataResponse,
  fetchOneTokenMetadata as fetchOneTokenMetadataOnAPI,
  fetchTokensMetadata as fetchTokensMetadataOnAPI,
  isKnownChainId
} from 'lib/apis/temple';

import { TokenMetadataOnChain, fetchTokenMetadata as fetchTokenMetadataOnChain } from './on-chain';
import { TokenMetadata } from './types';
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

const fetchTokensMetadata = async (rpcUrl: string, slugs: string[]): Promise<(TokenMetadataResponse | null)[]> => {
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

export const loadTokensMetadata = (rpcUrl: string, slugs: string[]): Promise<TokenMetadata[]> =>
  fetchTokensMetadata(rpcUrl, slugs).then(data =>
    data.reduce<TokenMetadata[]>((acc, token, index) => {
      const [address, id] = slugs[index].split('_');

      const metadata = token && buildTokenMetadataFromFetched(token, address, Number(id));

      return metadata ? acc.concat(metadata) : acc;
    }, [])
  );

export const loadTokensMetadata$ = (rpcUrl: string, slugs: string[]): Observable<TokenMetadata[]> =>
  from(fetchTokensMetadata(rpcUrl, slugs)).pipe(
    map(data =>
      data.reduce<TokenMetadata[]>((acc, token, index) => {
        const [address, id] = slugs[index].split('_');

        const metadata = token && buildTokenMetadataFromFetched(token, address, Number(id));

        return metadata ? acc.concat(metadata) : acc;
      }, [])
    )
  );
