import { TezosToolkit } from '@taquito/taquito';
import { pick } from 'lodash';

import {
  TokenMetadataResponse,
  fetchTokenMetadata as fetchTokenMetadataOnAPI,
  fetchTokensMetadata as fetchTokensMetadataOnAPI
} from 'lib/apis/temple';
import { TempleChainId } from 'lib/temple/types';

import { fetchTokenMetadata as fetchTokenMetadataOnChain, TokenMetadataOnChainResponse } from './on-chain';

export const fetchTokenMetadata = async (
  tezos: TezosToolkit,
  address: string,
  id: number = 0
): Promise<TokenMetadataResponse | undefined> => {
  // const rpcUrl = tezos.rpc.getRpcUrl();
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
