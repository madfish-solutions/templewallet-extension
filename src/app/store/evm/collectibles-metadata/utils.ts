import { getAddress, isAddress } from 'viem';

import {
  NftAddressBalanceNftResponse,
  NftCollectionAttribute,
  NftData,
  NftTokenContractBalanceItem,
  OpenseaNftDetailed,
  OpenseaNftRef
} from 'lib/apis/temple/endpoints/evm';
import { fromAssetSlug, toTokenSlug } from 'lib/assets';
import { EvmAssetStandard } from 'lib/evm/types';
import {
  collectibleImagePreviewUrl,
  collectibleStillPreviews,
  firstCollectibleArtifactUrl
} from 'lib/metadata/collectible-media';
import { EvmCollectibleMetadata } from 'lib/metadata/types';
import { patchRetiredSeadnImageUrl } from 'lib/metadata/utils';
import { equalsIgnoreCase, stripUndefinedProps } from 'lib/utils';
import { isProperCollectibleMetadata } from 'lib/utils/evm.utils';

import { EvmCollectibleMetadataRecord } from './state';

export const buildEvmCollectibleMetadataFromFetched = (
  collectible: NonNullableField<NftData, 'token_id' | 'external_data' | 'token_url'>,
  contract: NftTokenContractBalanceItem
): EvmCollectibleMetadata => {
  const { token_id, token_url, original_owner, external_data } = collectible;
  const { image, name: collectibleName, description, attributes, animation_url, external_url } = external_data;
  const goldrushImages = goldrushImageUrls(external_data);
  const primaryImage = previewImageUrl(patchGoldrushImageUrl(image));
  const { supports_erc, contract_address, contract_name, contract_ticker_symbol } = contract;

  return stripUndefinedProps({
    standard: getCollectibleStandard(supports_erc),
    address: getAddress(contract_address),
    tokenId: token_id,
    metadataUri: token_url,
    image: primaryImage && goldrushImages.includes(primaryImage) ? primaryImage : goldrushImages[0],
    images: goldrushImages.length ? goldrushImages : undefined,
    collectibleName,
    description,
    name: isSharedStorefrontTokenId(token_id) ? undefined : contract_name,
    symbol: contract_ticker_symbol,
    attributes,
    animationUrl: filledString(animation_url),
    artifactUrl: firstCollectibleArtifactUrl(animation_url, image),
    externalUrl: filledString(external_url),
    originalOwner: filledString(original_owner)
  });
};

const getCollectibleStandard = (supportedErcs: string[]) => {
  if (supportedErcs.some(erc => erc === EvmAssetStandard.ERC721)) {
    return EvmAssetStandard.ERC721;
  }

  if (supportedErcs.some(erc => erc === EvmAssetStandard.ERC1155)) {
    return EvmAssetStandard.ERC1155;
  }

  return undefined;
};

export const getSlugsWithProperCollectibleMetadata = (data: NftAddressBalanceNftResponse) => {
  const slugs = new Set<string>();

  for (const { contract_address, nft_data } of data.items) {
    for (const collectible of nft_data) {
      if (!isProperCollectibleMetadata(collectible)) continue;

      slugs.add(toTokenSlug(getAddress(contract_address), collectible.token_id));
    }
  }

  return slugs;
};

export const isOpenseaNftForRef = ({ contract, identifier }: OpenseaNftDetailed, ref: OpenseaNftRef) => {
  const { contractAddress, tokenId } = ref;

  return equalsIgnoreCase(contract, contractAddress) && sameTokenId(String(identifier), tokenId);
};

/** OpenSea sends a collection slug separately. Keep a Goldrush contract name and symbol when present. */
export const applyGoldrushContractIdentity = (
  metadata: EvmCollectibleMetadata,
  contract: NftTokenContractBalanceItem | undefined,
  collectible?: NftData
): EvmCollectibleMetadata => {
  if (!contract && !collectible) return metadata;

  const { standard, name, symbol, image, artifactUrl } = metadata;
  const images = mergeImageVariants(metadata.images, goldrushImageUrls(collectible?.external_data));

  return stripUndefinedProps({
    ...metadata,
    standard: standard ?? (contract ? getCollectibleStandard(contract.supports_erc) : undefined),
    name: name || filledString(contract?.contract_name),
    symbol: symbol || filledString(contract?.contract_ticker_symbol),
    image:
      previewImageUrl(patchGoldrushImageUrl(image)) ||
      previewImageUrl(patchGoldrushImageUrl(collectible?.external_data?.image)) ||
      images[0],
    images: images.length ? images : undefined,
    artifactUrl:
      artifactUrl ||
      firstCollectibleArtifactUrl(collectible?.external_data?.animation_url, collectible?.external_data?.image)
  });
};

export const findGoldrushCollectibleForSlug = (data: NftAddressBalanceNftResponse, slug: string) => {
  const [contractAddress, tokenId] = fromAssetSlug(slug);
  const contract = data.items.find(({ contract_address }) => equalsIgnoreCase(contract_address, contractAddress));
  if (!contract || !tokenId) return undefined;

  const collectible = contract.nft_data.find(nft => nft.token_id != null && sameTokenId(String(nft.token_id), tokenId));

  return { contract, collectible };
};

/** Keeps the first URL, then `extra`, then the remaining primary URLs. */
const mergeImageVariants = (primary?: readonly string[], extra?: readonly string[]) => {
  const [first, ...rest] = primary ?? [];

  return uniqueImageUrls(first, extra, rest);
};

const uniqueImageUrls = (...groups: Array<string | readonly string[] | null | undefined>) => {
  const urls: string[] = [];
  const seen = new Set<string>();

  for (const group of groups) {
    const values = typeof group === 'string' ? [group] : group;
    if (!values) continue;

    for (const url of values) {
      if (!url || seen.has(url)) continue;

      seen.add(url);
      urls.push(url);
    }
  }

  return urls;
};

export const buildEvmCollectibleMetadataFromOpensea = (
  nft: OpenseaNftDetailed,
  contractAddress: string,
  tokenId: string
): EvmCollectibleMetadata => {
  const {
    tokenStandard,
    displayImageUrl,
    imageUrl,
    originalImageUrl,
    displayAnimationUrl,
    animationUrl,
    originalAnimationUrl,
    metadataUrl,
    name,
    description,
    openseaUrl,
    creator,
    traits
  } = nft;

  const images = uniqueImageUrls(collectibleStillPreviews([displayImageUrl, imageUrl, originalImageUrl]));

  return stripUndefinedProps({
    address: getAddress(contractAddress),
    tokenId,
    standard: toCollectibleStandard(tokenStandard),
    metadataUri: filledString(metadataUrl),
    image: images[0],
    images: images.length ? images : undefined,
    collectibleName: filledString(name),
    description: filledString(description),
    animationUrl: firstFilledString(displayAnimationUrl, animationUrl, originalAnimationUrl),
    artifactUrl: firstCollectibleArtifactUrl(
      originalAnimationUrl,
      animationUrl,
      displayAnimationUrl,
      originalImageUrl,
      imageUrl,
      displayImageUrl
    ),
    externalUrl: filledString(openseaUrl),
    originalOwner: toOriginalOwner(creator),
    attributes: buildOpenseaAttributes(traits)
  });
};

const goldrushImageUrls = (externalData: NftData['external_data'] | undefined) => {
  if (!externalData) return [];

  const { image_256, image_512, image_1024, image } = externalData;

  return uniqueImageUrls(
    collectibleStillPreviews([image_256, image_512, image_1024, image].map(url => patchGoldrushImageUrl(url)))
  );
};

const previewImageUrl = (url: string | null | undefined) => {
  if (!url) return undefined;

  return collectibleImagePreviewUrl(url);
};

const patchGoldrushImageUrl = (url: string | null | undefined) => {
  const filled = filledString(url);
  if (!filled) return undefined;

  return patchRetiredSeadnImageUrl(filled);
};

const toCollectibleStandard = (tokenStandard: string | null | undefined) => {
  if (!tokenStandard) return undefined;

  const normalized = tokenStandard.toLowerCase();

  if (normalized === EvmAssetStandard.ERC721 || normalized === EvmAssetStandard.ERC1155) {
    return normalized;
  }

  return undefined;
};

const sameTokenId = (left: string, right: string) => {
  if (left === right) return true;
  if (!/^\d+$/.test(left) || !/^\d+$/.test(right)) return false;

  try {
    return BigInt(left) === BigInt(right);
  } catch {
    return false;
  }
};

const collectibleMatchKey = (contractAddress: string, tokenId: string) => {
  let normalizedId = tokenId;
  if (/^\d+$/.test(tokenId)) {
    try {
      normalizedId = BigInt(tokenId).toString();
    } catch {
      normalizedId = tokenId;
    }
  }

  return `${contractAddress.toLowerCase()}_${normalizedId}`;
};

export const indexCollectibleSlugs = (slugs: Iterable<string>) => {
  const index = new Map<string, string>();

  for (const slug of slugs) {
    const [contractAddress, tokenId] = fromAssetSlug(slug);
    if (!contractAddress) continue;

    index.set(collectibleMatchKey(contractAddress, tokenId ?? '0'), slug);
  }

  return index;
};

export const lookupCollectibleSlug = (index: ReadonlyMap<string, string>, contractAddress: string, tokenId: string) =>
  index.get(collectibleMatchKey(contractAddress, tokenId));

const filledString = (value: string | null | undefined) => value || undefined;

/**
 * Collection title: a Goldrush contract name, then a name already stored, then the OpenSea collection slug.
 * The slug is not a display name, and it still groups a collection that would otherwise be unknown.
 */
export const collectibleCollectionName = (
  contractName: string | null | undefined,
  storedName: string | null | undefined,
  collectionSlug: string | null | undefined
) => filledString(contractName) || filledString(storedName) || filledString(collectionSlug);

/** OpenSea Shared Storefront token ids are at least 2^96. One such contract hosts many collections. */
const SHARED_STOREFRONT_TOKEN_ID_MIN = 2n ** 96n;

export const isSharedStorefrontTokenId = (tokenId: string | undefined) => {
  if (!tokenId) return false;

  try {
    return BigInt(tokenId) >= SHARED_STOREFRONT_TOKEN_ID_MIN;
  } catch {
    return false;
  }
};

/** Creator address stored in bits 255–96 of a shared-storefront token id. */
export const sharedStorefrontCreatorAddress = (tokenId: string | undefined) => {
  if (!tokenId || !isSharedStorefrontTokenId(tokenId)) return undefined;

  return `0x${(BigInt(tokenId) >> 96n).toString(16).padStart(40, '0')}`;
};

interface ContractCollection {
  name?: string;
  /** More than one collection, or a shared-storefront token id. */
  blocked: boolean;
}

/** Collection name for contracts OpenSea treats as one collection. Shared-storefront contracts are omitted. */
export const singleContractCollectionNames = (metadataByChain: EvmCollectibleMetadataRecord | undefined) => {
  const names = new Map<string, string>();
  if (!metadataByChain) return names;

  for (const [chainId, records] of Object.entries(metadataByChain)) {
    for (const [key, collection] of contractCollections(records)) {
      if (!collection.blocked && collection.name) names.set(`${chainId}:${key}`, collection.name);
    }
  }

  return names;
};

/**
 * Collection title for one owned NFT. A contract OpenSea treats as a single collection shares
 * that name with every token, including tokens that do not have their own metadata yet.
 * Shared-storefront token ids stay unnamed here: one contract hosts many collections.
 */
export const evmContractCollectionName = (
  names: ReadonlyMap<string, string>,
  chainId: number,
  assetSlug: string,
  ownName?: string
) => {
  if (ownName) return ownName;

  const [address, tokenId] = fromAssetSlug(assetSlug);
  if (!address || isSharedStorefrontTokenId(tokenId)) return undefined;

  return names.get(`${chainId}:${address.toLowerCase()}`);
};

/**
 * Collection title stored for this NFT. A shared-storefront token uses only its OpenSea slug.
 * A Goldrush contract name such as the storefront's own title is not a collection.
 */
export const evmStoredCollectionName = (metadata: EvmCollectibleMetadata | undefined, assetSlug: string) => {
  const tokenId = metadata?.tokenId || fromAssetSlug(assetSlug)[1];
  if (isSharedStorefrontTokenId(tokenId)) return metadata?.openseaCollection;

  return metadata?.name;
};

/**
 * Copies the one known collection name onto nameless NFTs of that contract.
 * A shared-storefront contract, or a contract that already has two names, is left unchanged.
 * A storefront token keeps a collection name only after OpenSea has returned its slug.
 */
export const assignSingleContractCollectionNames = (records: StringRecord<EvmCollectibleMetadata> | undefined) => {
  if (!records) return;

  for (const metadata of Object.values(records)) {
    if (!metadata || !isSharedStorefrontTokenId(metadata.tokenId) || metadata.openseaCollection) continue;

    delete metadata.name;
  }

  const collections = contractCollections(records);

  for (const metadata of Object.values(records)) {
    if (!metadata?.address || metadata.name) continue;

    const collection = collections.get(metadata.address.toLowerCase());
    if (!collection?.name || collection.blocked) continue;

    metadata.name = collection.name;
  }
};

const contractCollections = (records: StringRecord<EvmCollectibleMetadata> | undefined) => {
  const collections = new Map<string, ContractCollection>();
  if (!records) return collections;

  for (const metadata of Object.values(records)) {
    if (!metadata?.address) continue;

    const key = metadata.address.toLowerCase();
    let collection = collections.get(key);
    if (!collection) {
      collection = { blocked: false };
      collections.set(key, collection);
    }

    if (isSharedStorefrontTokenId(metadata.tokenId)) collection.blocked = true;
    if (!metadata.name || collection.blocked) continue;

    if (collection.name && collection.name !== metadata.name) {
      collection.blocked = true;
      collection.name = undefined;
      continue;
    }

    collection.name = metadata.name;
  }

  return collections;
};

const firstFilledString = (...values: Array<string | null | undefined>) =>
  values.find((value): value is string => Boolean(filledString(value)));

const toAttributeValue = (value: unknown) => {
  if (typeof value === 'string') return filledString(value);
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return String(value);

  return undefined;
};

const buildOpenseaAttributes = (traits: OpenseaNftDetailed['traits'] | undefined) => {
  if (!traits?.length) return undefined;

  const attributes: NftCollectionAttribute[] = [];

  for (const { traitType, value: rawValue } of traits) {
    const value = toAttributeValue(rawValue);
    if (!traitType || !value) continue;

    attributes.push({ trait_type: traitType, value });
  }

  return attributes.length ? attributes : undefined;
};

const toOriginalOwner = (creator: string | null | undefined) => {
  if (!creator || !isAddress(creator)) return undefined;

  return getAddress(creator);
};
