import { TezosToolkit } from '@taquito/taquito';
import { pick } from 'lodash';

import {
  TokenMetadataResponse,
  fetchOneTokenMetadata as fetchOneTokenMetadataOnAPI,
  fetchTokensMetadata as fetchTokensMetadataOnAPI,
  isKnownChainId
} from 'lib/apis/temple';
import { fromAssetSlug } from 'lib/assets';

import { TokenMetadataOnChain, fetchTokenMetadata as fetchTokenMetadataOnChain } from './on-chain';

export const fetchOneTokenMetadata = async (
  rpcUrl: string,
  address: string,
  id: string
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
      const [address, id] = fromAssetSlug(slug);
      if (!id) return null;

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

export const loadTokensMetadata = (rpcUrl: string, slugs: string[]) =>
  fetchTokensMetadata(rpcUrl, slugs).then(data => reduceToMetadataRecord(slugs, data));

export type FetchedMetadataRecord = Record<string, TokenMetadataResponse | null>;

export const reduceToMetadataRecord = (slugs: string[], list: (TokenMetadataResponse | null)[]) =>
  list.reduce<FetchedMetadataRecord>((acc, metadata, index) => {
    const slug = slugs[index]!;

    return { ...acc, [slug]: metadata };
  }, {});
