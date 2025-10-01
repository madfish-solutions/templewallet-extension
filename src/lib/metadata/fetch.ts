import { pick } from 'lodash';

import {
  TokenMetadataResponse,
  fetchOneTokenMetadata as fetchOneTokenMetadataOnAPI,
  fetchTokensMetadata as fetchTokensMetadataOnAPI,
  isKnownChainId
} from 'lib/apis/temple';
import { fromAssetSlug } from 'lib/assets';
import { TezosNetworkEssentials } from 'temple/networks';
import { getReadOnlyTezos } from 'temple/tezos';

import { TokenMetadataOnChain, fetchTokenMetadata as fetchTokenMetadataOnChain } from './on-chain';

export const fetchOneTokenMetadata = async (
  network: TezosNetworkEssentials,
  address: string,
  id: string
): Promise<TokenMetadataResponse | undefined> => {
  const tezos = getReadOnlyTezos(network);

  if (isKnownChainId(network.chainId)) {
    return await fetchOneTokenMetadataOnAPI(network.chainId, address, id);
  }

  const metadataOnChain = await fetchTokenMetadataOnChain(tezos, address, id);

  return chainTokenMetadataToBase(metadataOnChain) || undefined;
};

export const fetchTokensMetadata = async (
  network: TezosNetworkEssentials,
  slugs: string[]
): Promise<(TokenMetadataResponse | null)[]> => {
  if (slugs.length === 0) return [];

  const tezos = getReadOnlyTezos(network);

  if (isKnownChainId(network.chainId)) {
    return await fetchTokensMetadataOnAPI(network.chainId, slugs);
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

export const loadTokensMetadata = (network: TezosNetworkEssentials, slugs: string[]) =>
  fetchTokensMetadata(network, slugs).then(data => reduceToMetadataRecord(slugs, data));

export type FetchedMetadataRecord = Record<string, TokenMetadataResponse | null>;

export const reduceToMetadataRecord = (slugs: string[], list: (TokenMetadataResponse | null)[]) =>
  list.reduce<FetchedMetadataRecord>((acc, metadata, index) => {
    const slug = slugs[index]!;

    return { ...acc, [slug]: metadata };
  }, {});
