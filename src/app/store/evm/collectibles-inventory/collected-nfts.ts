import { Action } from 'redux';
import { EMPTY } from 'rxjs';
import { getAddress } from 'viem';

import { getOpenseaAccountCollections } from 'lib/apis/temple/endpoints/evm';
import { GetContractsForOwnerResponse, NftsResponse } from 'lib/apis/temple/endpoints/evm/alchemy';
import { OpenseaNftDetailed } from 'lib/apis/temple/endpoints/evm/opensea';
import { isAbortError } from 'lib/apis/utils';
import { toTokenSlug } from 'lib/assets';
import { EvmCollectibleMetadata } from 'lib/metadata/types';

import { enableEvmCollectiblesAction } from '../assets/actions';
import { putEvmCollectiblesMetadataAction } from '../collectibles-metadata/actions';
import { buildEvmCollectibleMetadataFromOpensea, isSharedStorefrontTokenId } from '../collectibles-metadata/utils';

import { loadedNftFromAlchemy, metadataFromAlchemyNft } from './alchemy-nft';
import { InventoryCollectionRef, InventoryContractRef, InventoryLoadedNft } from './place-collections';

/** Alchemy's owner-NFT route accepts at most this many contract addresses. */
export const ALCHEMY_CONTRACT_FILTER_LIMIT = 45;
/** A token-id search and a collection scan follow at most this many owner-NFT pages. */
export const ALCHEMY_TOKEN_ID_PAGE_LIMIT = 5;

const distinctCount = (value: string) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
};

export const sameTokenId = (left: string, right: string) => {
  if (left === right) return true;
  if (!/^\d+$/.test(left) || !/^\d+$/.test(right)) return false;

  try {
    return BigInt(left) === BigInt(right);
  } catch {
    return false;
  }
};

export const checksumAddress = (address: string) => {
  try {
    return getAddress(address);
  } catch {
    return undefined;
  }
};

export interface CollectedNfts {
  records: StringRecord<EvmCollectibleMetadata>;
  loaded: InventoryLoadedNft[];
  slugs: string[];
}

export const emptyCollected = (): CollectedNfts => ({ records: {}, loaded: [], slugs: [] });

export const collectAlchemyNfts = (nfts: NftsResponse['ownedNfts']): CollectedNfts => {
  const collected = emptyCollected();

  for (const nft of nfts) {
    const metadata = metadataFromAlchemyNft(nft);
    if (!metadata) continue;

    const slug = toTokenSlug(metadata.address, metadata.tokenId);
    collected.records[slug] = metadata;
    collected.loaded.push(loadedNftFromAlchemy(nft, slug));
    collected.slugs.push(slug);
  }

  return collected;
};

export const contractsFromResponse = (response: GetContractsForOwnerResponse): InventoryContractRef[] => {
  const contracts: InventoryContractRef[] = [];

  for (const contract of response.contracts) {
    const address = checksumAddress(contract.address);
    if (!address) continue;

    contracts.push({
      address,
      name: contract.name || contract.openSeaMetadata.collectionName,
      distinctTokensOwned: distinctCount(contract.numDistinctTokensOwned),
      imageUrl:
        contract.image.thumbnailUrl || contract.image.cachedUrl || contract.image.pngUrl || contract.image.originalUrl
    });
  }

  return contracts;
};

export const collectionsFromResponse = (
  collections: Awaited<ReturnType<typeof getOpenseaAccountCollections>>['collections']
): InventoryCollectionRef[] =>
  collections.map(collection => ({
    slug: collection.collection,
    name: collection.name,
    imageUrl: collection.imageUrl || undefined,
    itemCount: collection.itemCount,
    contractAddresses: collection.contracts.map(contract => contract.address)
  }));

export const publishCollected = (
  account: HexString,
  chainId: number,
  collected: CollectedNfts,
  options?: { enable?: boolean }
): Action[] => {
  const actions: Action[] = [];
  if (!collected.slugs.length) return actions;

  actions.push(putEvmCollectiblesMetadataAction({ chainId, records: collected.records }));
  if (options?.enable !== false)
    actions.push(enableEvmCollectiblesAction({ publicKeyHash: account, chainId, slugs: collected.slugs }));

  return actions;
};

export const metadataFromOpenseaOwnedNft = (nft: OpenseaNftDetailed, collectionName: string) => {
  const metadata = buildEvmCollectibleMetadataFromOpensea(nft, nft.contract, nft.identifier);
  const storefront = isSharedStorefrontTokenId(nft.identifier);
  const name = storefront ? nft.collection : collectionName;

  return {
    ...metadata,
    name,
    openseaCollection: storefront ? nft.collection : undefined,
    collectibleName: nft.name || undefined
  };
};

export const emptyAfterAbort = (error: unknown) => {
  if (!isAbortError(error)) console.error(error);

  return EMPTY;
};
