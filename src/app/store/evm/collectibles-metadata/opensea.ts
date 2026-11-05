import { AssetSlugStoredAssetRecord, ChainIdTokenSlugsAssetsRecord } from 'app/store/evm/assets/state';
import {
  getOpenseaChainNftsMetadata,
  NftAddressBalanceNftResponse,
  OPENSEA_MULTICHAIN_NFTS_LIMIT,
  OpenseaNftDetailed,
  OpenseaNftRef
} from 'lib/apis/temple/endpoints/evm';
import { isSupportedChainId } from 'lib/apis/temple/endpoints/evm/api.utils';
import { readRetryAfterMs } from 'lib/apis/utils';
import { fromAssetSlug, parseChainAssetSlug, toTokenSlug } from 'lib/assets/utils';
import { previewUrlIsOpenseaHosted } from 'lib/metadata/collectible-media';
import { EvmCollectibleMetadata } from 'lib/metadata/types';
import { patchRetiredSeadnImageUrl } from 'lib/metadata/utils';
import { stripUndefinedProps } from 'lib/utils';
import { parseMediaUri } from 'lib/utils/ipfs';
import { TempleChainKind } from 'temple/types';

import { EvmCollectibleMetadataRecord } from './state';
import {
  applyGoldrushContractIdentity,
  buildEvmCollectibleMetadataFromOpensea,
  collectibleCollectionName,
  findGoldrushCollectibleForSlug,
  isSharedStorefrontTokenId,
  sharedStorefrontCreatorAddress,
  singleContractCollectionNames,
  indexCollectibleSlugs,
  isOpenseaNftForRef,
  lookupCollectibleSlug
} from './utils';

/**
 * True when the preview is missing or only good enough as a last resort: an IPFS URL, including
 * `ipfs.covalenthq.com`, or an `i.seadn.io` URL that cannot be rewritten.
 * A missing preview is enough when the playable file is already on OpenSea's CDN.
 */
const imageUrlIsLastResort = (url: string) => {
  const patched = patchRetiredSeadnImageUrl(url);
  if (!patched) return true;

  return Boolean(parseMediaUri(patched).ipfsAware.ipfs);
};

export const collectiblePreviewIsLastResort = (metadata: EvmCollectibleMetadata | undefined) => {
  const url = metadata?.images?.[0] ?? metadata?.image;
  if (!url) return !previewUrlIsOpenseaHosted(metadata?.artifactUrl);

  return imageUrlIsLastResort(url);
};

/** A Goldrush CDN image can sit behind an OpenSea IPFS url. Show the preferred one first. */
const promotePreferredPreview = (metadata: EvmCollectibleMetadata): EvmCollectibleMetadata => {
  const images = metadata.images ?? (metadata.image ? [metadata.image] : []);
  const preferredIndex = images.findIndex(url => !imageUrlIsLastResort(url));
  if (preferredIndex <= 0) return metadata;

  const preferred = images[preferredIndex];

  return {
    ...metadata,
    image: preferred,
    images: [preferred, ...images.filter((_, index) => index !== preferredIndex)]
  };
};

/**
 * Visible EVM collectibles that still need an OpenSea preview or a collection name, capped at one batch.
 * `collectionNameRequestedSlugs` are nameless collectibles already sent to OpenSea this session.
 */
export const openseaNftRefsFromVisibleSlugs = (
  chainAssetSlugs: readonly string[],
  metadataByChain: EvmCollectibleMetadataRecord | undefined,
  failedPreviewSlugs?: ReadonlySet<string>,
  collectionNameRequestedSlugs?: ReadonlySet<string>
): OpenseaNftRef[] => {
  const refs: OpenseaNftRef[] = [];
  const seen = new Set<string>();
  const collectionNameByContract = singleContractCollectionNames(metadataByChain);

  const push = (chainAssetSlug: string) => {
    if (refs.length >= OPENSEA_MULTICHAIN_NFTS_LIMIT || seen.has(chainAssetSlug)) return;

    const [chainKind, chainId, assetSlug] = parseChainAssetSlug(chainAssetSlug);
    if (chainKind !== TempleChainKind.EVM || typeof chainId !== 'number') return;

    const [contractAddress, tokenId] = fromAssetSlug(assetSlug);
    if (!contractAddress || !tokenId) return;

    const metadata = metadataByChain?.[chainId]?.[assetSlug];
    const previewFailed = Boolean(failedPreviewSlugs?.has(chainAssetSlug));
    const needsPreview = previewFailed
      ? !previewUrlIsOpenseaHosted(metadata?.images?.[0] ?? metadata?.image)
      : collectiblePreviewIsLastResort(metadata);
    const storefrontToken = isSharedStorefrontTokenId(tokenId);
    const knownCollectionName = storefrontToken
      ? undefined
      : collectionNameByContract.get(`${chainId}:${contractAddress.toLowerCase()}`);
    // Goldrush names a shared-storefront contract, not the collection inside it.
    const needsCollectionName = storefrontToken
      ? !metadata?.openseaCollection && !collectionNameRequestedSlugs?.has(chainAssetSlug)
      : !metadata?.name && !knownCollectionName && !collectionNameRequestedSlugs?.has(chainAssetSlug);
    if (!needsPreview && !needsCollectionName) return;
    // A collection page, or an earlier batch, is already learning this token's collection.
    if (
      !needsPreview &&
      (sharedStorefrontFillInFlight(chainId, contractAddress) ||
        requestedStorefrontNameKeys.has(openseaRefKey(chainId, contractAddress, tokenId)))
    ) {
      return;
    }

    seen.add(chainAssetSlug);
    refs.push({ chainId, contractAddress, tokenId });
  };

  for (const chainAssetSlug of chainAssetSlugs) push(chainAssetSlug);

  if (failedPreviewSlugs) {
    for (const chainAssetSlug of failedPreviewSlugs) push(chainAssetSlug);
  }

  return refs;
};

const openseaRefKey = (chainId: number, contractAddress: string, tokenId: string) =>
  `${chainId}:${contractAddress.toLowerCase()}:${tokenId}`;

/** The route indexes results by this pair and ignores chain id. */
const openseaContractIdKey = (contractAddress: string, tokenId: string) =>
  `${contractAddress.toLowerCase()}-${tokenId.toLowerCase()}`;

interface OpenseaRefBatch {
  refs: OpenseaNftRef[];
  contractIdKeys: Set<string>;
}

const hasDuplicateContractId = (refs: readonly OpenseaNftRef[]) => {
  const keys = new Set<string>();

  for (const ref of refs) {
    const key = openseaContractIdKey(ref.contractAddress, ref.tokenId);
    if (keys.has(key)) return true;

    keys.add(key);
  }

  return false;
};

const placeInExistingBatch = (batches: OpenseaRefBatch[], ref: OpenseaNftRef) => {
  const key = openseaContractIdKey(ref.contractAddress, ref.tokenId);

  for (const batch of batches) {
    if (batch.refs.length >= OPENSEA_MULTICHAIN_NFTS_LIMIT || batch.contractIdKeys.has(key)) continue;

    batch.refs.push(ref);
    batch.contractIdKeys.add(key);

    return true;
  }

  return false;
};

/** Nameless shared-storefront tokens already sent for a collection name this session. */
const requestedStorefrontNameKeys = new Set<string>();

/** Test isolation. A remembered token is not requested again only to learn its collection. */
export const clearRequestedStorefrontNames = () => requestedStorefrontNameKeys.clear();

const rememberNamelessStorefrontRef = (
  ref: OpenseaNftRef,
  metadataByChain: EvmCollectibleMetadataRecord | undefined
) => {
  if (!isSharedStorefrontTokenId(ref.tokenId)) return;

  const slug = toTokenSlug(ref.contractAddress, ref.tokenId);
  if (metadataByChain?.[ref.chainId]?.[slug]?.openseaCollection) return;

  requestedStorefrontNameKeys.add(openseaRefKey(ref.chainId, ref.contractAddress, ref.tokenId));
};

/**
 * One nameless shared-storefront token per creator, using spare slots in the batches already opened.
 * A second token of a creator already in the batch waits, so the slots discover new collections first.
 */
const fillDistinctStorefrontCreators = (
  batches: OpenseaRefBatch[],
  placed: Set<string>,
  collectiblesByChain: ChainIdTokenSlugsAssetsRecord,
  metadataByChain: EvmCollectibleMetadataRecord | undefined,
  batchesAreFull: () => boolean
) => {
  const creatorsInBatch = new Set<string>();

  for (const batch of batches) {
    for (const ref of batch.refs) {
      const creator = sharedStorefrontCreatorAddress(ref.tokenId);
      if (creator) creatorsInBatch.add(creator);
    }
  }

  const chosen = new Map<string, OpenseaNftRef>();

  for (const chainIdKey in collectiblesByChain) {
    const chainId = Number(chainIdKey);
    if (!isSupportedChainId(chainId)) continue;

    const collectibles = collectiblesByChain[chainId];
    if (!collectibles) continue;

    const metadataBySlug = metadataByChain?.[chainId];

    for (const slug in collectibles) {
      const status = collectibles[slug]?.status;
      if (status === 'disabled' || status === 'removed') continue;

      const separator = slug.indexOf('_');
      if (separator < 1) continue;

      const contractAddress = slug.slice(0, separator);
      const tokenId = slug.slice(separator + 1);
      const creator = sharedStorefrontCreatorAddress(tokenId);
      if (!creator || creatorsInBatch.has(creator) || chosen.has(creator)) continue;
      if (metadataBySlug?.[slug]?.openseaCollection || sharedStorefrontFillInFlight(chainId, contractAddress)) continue;

      const chainKey = openseaRefKey(chainId, contractAddress, tokenId);
      if (placed.has(chainKey) || requestedStorefrontNameKeys.has(chainKey)) continue;

      chosen.set(creator, { chainId, contractAddress, tokenId });
    }
  }

  for (const ref of chosen.values()) {
    if (batchesAreFull()) break;
    if (!placeInExistingBatch(batches, ref)) continue;

    const chainKey = openseaRefKey(ref.chainId, ref.contractAddress, ref.tokenId);
    placed.add(chainKey);
    requestedStorefrontNameKeys.add(chainKey);
  }
};

/**
 * Remaining spare slots name other shared-storefront tokens Goldrush already described.
 * One sample per creator stays first so a new collection is found before a second token of the same creator.
 */
const fillUnnamedStorefrontTokens = (
  batches: OpenseaRefBatch[],
  placed: Set<string>,
  collectiblesByChain: ChainIdTokenSlugsAssetsRecord,
  metadataByChain: EvmCollectibleMetadataRecord | undefined,
  batchesAreFull: () => boolean
) => {
  for (const chainIdKey in collectiblesByChain) {
    if (batchesAreFull()) break;

    const chainId = Number(chainIdKey);
    if (!isSupportedChainId(chainId)) continue;

    const collectibles = collectiblesByChain[chainId];
    if (!collectibles) continue;

    const metadataBySlug = metadataByChain?.[chainId];

    for (const slug in collectibles) {
      if (batchesAreFull()) break;

      const status = collectibles[slug]?.status;
      if (status === 'disabled' || status === 'removed') continue;

      const separator = slug.indexOf('_');
      if (separator < 1) continue;

      const contractAddress = slug.slice(0, separator);
      const tokenId = slug.slice(separator + 1);
      if (!isSharedStorefrontTokenId(tokenId)) continue;
      if (metadataBySlug?.[slug]?.openseaCollection || sharedStorefrontFillInFlight(chainId, contractAddress)) continue;

      const chainKey = openseaRefKey(chainId, contractAddress, tokenId);
      if (placed.has(chainKey) || requestedStorefrontNameKeys.has(chainKey)) continue;
      if (!placeInExistingBatch(batches, { chainId, contractAddress, tokenId })) continue;

      placed.add(chainKey);
      requestedStorefrontNameKeys.add(chainKey);
    }
  }
};

/**
 * Groups refs into requests of at most 30. The same contract address and token id on another chain
 * goes in a later request. Requested refs stay first. Spare slots then take one shared-storefront
 * token per creator that OpenSea has not named, then the other such tokens, then other previews.
 */
export const buildOpenseaMultichainRefBatches = (
  refs: OpenseaNftRef[],
  collectiblesByChain: ChainIdTokenSlugsAssetsRecord | undefined,
  metadataByChain: EvmCollectibleMetadataRecord | undefined
): OpenseaNftRef[][] => {
  if (refs.length >= OPENSEA_MULTICHAIN_NFTS_LIMIT && !hasDuplicateContractId(refs)) {
    const batch = refs.length > OPENSEA_MULTICHAIN_NFTS_LIMIT ? refs.slice(0, OPENSEA_MULTICHAIN_NFTS_LIMIT) : refs;
    for (const ref of batch) rememberNamelessStorefrontRef(ref, metadataByChain);

    return [batch];
  }

  for (const ref of refs) rememberNamelessStorefrontRef(ref, metadataByChain);

  const batches: OpenseaRefBatch[] = [];
  const placed = new Set<string>();

  for (const ref of refs) {
    const chainKey = openseaRefKey(ref.chainId, ref.contractAddress, ref.tokenId);
    if (placed.has(chainKey)) continue;

    if (!placeInExistingBatch(batches, ref)) {
      batches.push({ refs: [ref], contractIdKeys: new Set([openseaContractIdKey(ref.contractAddress, ref.tokenId)]) });
    }

    placed.add(chainKey);
  }

  if (!collectiblesByChain) return batches.map(batch => batch.refs);
  if (!batches.length) batches.push({ refs: [], contractIdKeys: new Set() });

  const batchesAreFull = () => batches.every(batch => batch.refs.length >= OPENSEA_MULTICHAIN_NFTS_LIMIT);

  fillDistinctStorefrontCreators(batches, placed, collectiblesByChain, metadataByChain, batchesAreFull);
  fillUnnamedStorefrontTokens(batches, placed, collectiblesByChain, metadataByChain, batchesAreFull);

  for (const chainIdKey in collectiblesByChain) {
    if (batchesAreFull()) break;

    const chainId = Number(chainIdKey);
    if (!isSupportedChainId(chainId)) continue;

    const collectibles: AssetSlugStoredAssetRecord | undefined = collectiblesByChain[chainId];
    if (!collectibles) continue;

    const metadataBySlug = metadataByChain?.[chainId];

    for (const slug in collectibles) {
      if (batchesAreFull()) break;

      const status = collectibles[slug]?.status;
      if (status === 'disabled' || status === 'removed') continue;
      if (!collectiblePreviewIsLastResort(metadataBySlug?.[slug])) continue;

      const separator = slug.indexOf('_');
      if (separator < 1) continue;

      const contractAddress = slug.slice(0, separator);
      const tokenId = slug.slice(separator + 1);
      if (!tokenId) continue;

      const chainKey = openseaRefKey(chainId, contractAddress, tokenId);
      if (placed.has(chainKey)) continue;
      if (!placeInExistingBatch(batches, { chainId, contractAddress, tokenId })) continue;

      placed.add(chainKey);
    }
  }

  return batches.map(batch => batch.refs).filter(batch => batch.length > 0);
};

const storefrontFillCounts = new Map<string, number>();
let storefrontFillGeneration = 0;

const storefrontFillKey = (chainId: number, contractAddress: string) => `${chainId}:${contractAddress.toLowerCase()}`;

/** True while a collection-filtered account request is naming other tokens of this storefront contract. */
const sharedStorefrontFillInFlight = (chainId: number, contractAddress: string) =>
  (storefrontFillCounts.get(storefrontFillKey(chainId, contractAddress)) ?? 0) > 0;

/** Holds name-only batch requests for this contract until the collection page finishes. */
export const noteSharedStorefrontCollectionLoad = (chainId: number, contractAddress: string) => {
  const key = storefrontFillKey(chainId, contractAddress);
  storefrontFillCounts.set(key, (storefrontFillCounts.get(key) ?? 0) + 1);
};

export const currentSharedStorefrontFillGeneration = () => storefrontFillGeneration;

/** Drops in-flight collection loads so a finished request from the previous list cannot release a newer one. */
export const cancelSharedStorefrontCollectionLoads = () => {
  storefrontFillGeneration += 1;
  storefrontFillCounts.clear();
};

/**
 * Lets remaining nameless storefront tokens be requested again.
 * A generation captured when the load started ignores a release after that load was cancelled.
 */
export const finishSharedStorefrontCollectionLoad = (chainId: number, contractAddress: string, generation?: number) => {
  if (generation !== undefined && generation !== storefrontFillGeneration) return;

  const key = storefrontFillKey(chainId, contractAddress);
  const count = storefrontFillCounts.get(key) ?? 0;
  if (count <= 1) storefrontFillCounts.delete(key);
  else storefrontFillCounts.set(key, count - 1);
};

export interface SharedStorefrontCollectionLoad {
  collection: string;
  contractAddress: string;
}

/**
 * A filtered account request is worth it when the creator still averages more than this many
 * tokens for each collection of theirs we have already seen. Two or fewer fit in the batch.
 */
const STOREFRONT_COLLECTION_MIN_TOKENS_PER_COLLECTION = 2;

interface StorefrontCreatorHoldings {
  contractAddress: string;
  tokenCount: number;
  /** OpenSea collection slugs seen for this creator in the current response. */
  collections: Map<string, number>;
  unnamedOutside: number;
}

const storefrontCreatorKey = (contractAddress: string, creator: string) =>
  `${contractAddress.toLowerCase()}:${creator}`;

/**
 * Collection requests for shared-storefront creators whose tokens concentrate in few collections.
 * Highest tokens-per-collection first. A creator averaging two or fewer is left to the batch.
 */
export const sharedStorefrontCollectionsToLoad = (
  chainId: number,
  nfts: readonly OpenseaNftDetailed[],
  ownedSlugs: readonly string[],
  storedBySlug: StringRecord<EvmCollectibleMetadata> | undefined,
  namedSlugs: ReadonlySet<string>,
  alreadyRequested: ReadonlySet<string>
): SharedStorefrontCollectionLoad[] => {
  const slugIndex = indexCollectibleSlugs(ownedSlugs);
  const receivedSlugs = new Set<string>();
  const holdings = new Map<string, StorefrontCreatorHoldings>();

  for (const slug of ownedSlugs) {
    const [address, tokenId] = fromAssetSlug(slug);
    const creator = sharedStorefrontCreatorAddress(tokenId);
    if (!address || !creator) continue;

    const key = storefrontCreatorKey(address, creator);
    const group = holdings.get(key) ?? {
      contractAddress: address,
      tokenCount: 0,
      collections: new Map(),
      unnamedOutside: 0
    };
    group.tokenCount += 1;
    holdings.set(key, group);
  }

  for (const nft of nfts) {
    const tokenId = String(nft.identifier);
    const creator = sharedStorefrontCreatorAddress(tokenId);
    const collection = nft.collection.trim();
    if (!creator || !collection || alreadyRequested.has(`${chainId}:${collection}`)) continue;

    const slug = lookupCollectibleSlug(slugIndex, nft.contract, tokenId);
    if (!slug) continue;

    receivedSlugs.add(slug);
    const group = holdings.get(storefrontCreatorKey(nft.contract, creator));
    if (!group) continue;

    group.collections.set(collection, (group.collections.get(collection) ?? 0) + 1);
  }

  for (const slug of ownedSlugs) {
    if (receivedSlugs.has(slug) || namedSlugs.has(slug) || storedBySlug?.[slug]?.openseaCollection) continue;

    const [address, tokenId] = fromAssetSlug(slug);
    const creator = sharedStorefrontCreatorAddress(tokenId);
    if (!address || !creator) continue;

    const group = holdings.get(storefrontCreatorKey(address, creator));
    if (group) group.unnamedOutside += 1;
  }

  const byCollection = new Map<string, SharedStorefrontCollectionLoad & { ratio: number; known: number }>();

  for (const group of holdings.values()) {
    const collectionCount = group.collections.size;
    if (!collectionCount || group.unnamedOutside < 1) continue;
    if (group.tokenCount <= collectionCount * STOREFRONT_COLLECTION_MIN_TOKENS_PER_COLLECTION) continue;

    const ratio = group.tokenCount / collectionCount;

    for (const [collection, known] of group.collections) {
      const existing = byCollection.get(collection);
      if (existing && (existing.ratio > ratio || (existing.ratio === ratio && existing.known >= known))) continue;

      byCollection.set(collection, { collection, contractAddress: group.contractAddress, ratio, known });
    }
  }

  return Array.from(byCollection.values())
    .sort((a, b) => b.ratio - a.ratio || b.known - a.known || a.collection.localeCompare(b.collection))
    .map(({ collection, contractAddress }) => ({ collection, contractAddress }));
};

interface OpenseaAccountNftLoad {
  nfts: OpenseaNftDetailed[];
  /** Present when the page received HTTP 429. */
  retry?: { readyAt: number };
}

/** One OpenSea account page, 200 NFTs. Further pages are not requested. `collection` limits that page to one slug. */
export const loadOpenseaAccountNfts = async (
  chainId: number,
  account: HexString,
  slugs: Iterable<string>,
  collection?: string,
  signal?: AbortSignal
): Promise<OpenseaAccountNftLoad> => {
  const slugIndex = indexCollectibleSlugs(slugs);
  if (!slugIndex.size) return { nfts: [] };

  let response: Awaited<ReturnType<typeof getOpenseaChainNftsMetadata>>;

  try {
    response = await getOpenseaChainNftsMetadata(chainId, account, collection, undefined, signal);
  } catch (error) {
    const delayMs = readRetryAfterMs(error);
    if (delayMs === undefined) throw error;

    return { nfts: [], retry: { readyAt: Date.now() + delayMs } };
  }

  const nfts: OpenseaNftDetailed[] = [];

  for (const nft of response.nfts ?? []) {
    const slug = lookupCollectibleSlug(slugIndex, nft.contract, String(nft.identifier));
    if (!slug) continue;

    nfts.push(nft);
  }

  return { nfts };
};

const metadataFromOpenseaNft = (
  nft: OpenseaNftDetailed,
  contractAddress: string,
  tokenId: string,
  slug: string,
  goldrushData: NftAddressBalanceNftResponse | undefined,
  stored: EvmCollectibleMetadata | undefined
) => {
  try {
    let metadata = buildEvmCollectibleMetadataFromOpensea(nft, contractAddress, tokenId);

    if (goldrushData) {
      const match = findGoldrushCollectibleForSlug(goldrushData, slug);
      if (match) metadata = applyGoldrushContractIdentity(metadata, match.contract, match.collectible);
    }

    if (isSharedStorefrontTokenId(tokenId)) {
      const collection = nft.collection.trim();
      if (collection) {
        metadata.name = collection;
        metadata.openseaCollection = collection;
      } else {
        delete metadata.name;
      }
    } else {
      const collectionName = collectibleCollectionName(metadata.name, stored?.name, nft.collection);
      if (collectionName) metadata.name = collectionName;
    }
    if (!metadata.symbol && stored?.symbol) metadata.symbol = stored.symbol;

    return promotePreferredPreview(metadata);
  } catch (error) {
    console.error(error);

    return undefined;
  }
};

/** Account-page NFTs first, then the explicit batch refs, so the requested visible items win. */
export const collectOpenseaMetadataRecords = (
  slugs: Iterable<string>,
  accountNfts: readonly OpenseaNftDetailed[],
  batchRefs: readonly OpenseaNftRef[],
  batchResults: ReadonlyArray<OpenseaNftDetailed | null>,
  goldrushData?: NftAddressBalanceNftResponse,
  storedBySlug?: StringRecord<EvmCollectibleMetadata>
) => {
  const slugIndex = indexCollectibleSlugs(slugs);
  const records: StringRecord<EvmCollectibleMetadata> = {};

  for (const nft of accountNfts) {
    const tokenId = String(nft.identifier);
    const slug = lookupCollectibleSlug(slugIndex, nft.contract, tokenId);
    if (!slug) continue;

    assignOpenseaRecord(records, nft, nft.contract, tokenId, slug, goldrushData, storedBySlug?.[slug]);
  }

  batchResults.forEach((nft, index) => {
    const ref = batchRefs[index];
    if (!ref || !nft || !isOpenseaNftForRef(nft, ref)) return;

    const slug = lookupCollectibleSlug(slugIndex, ref.contractAddress, ref.tokenId);
    if (!slug) return;

    assignOpenseaRecord(records, nft, ref.contractAddress, ref.tokenId, slug, goldrushData, storedBySlug?.[slug]);
  });

  return records;
};

/**
 * Stores the OpenSea record. A last-resort preview does not replace a preview already stored.
 * Its collection slug is copied onto that record. With nothing stored yet, the last-resort
 * preview is kept, so the name and image are not dropped.
 */
const assignOpenseaRecord = (
  records: StringRecord<EvmCollectibleMetadata>,
  nft: OpenseaNftDetailed,
  contractAddress: string,
  tokenId: string,
  slug: string,
  goldrushData: NftAddressBalanceNftResponse | undefined,
  stored: EvmCollectibleMetadata | undefined
) => {
  const metadata = metadataFromOpenseaNft(nft, contractAddress, tokenId, slug, goldrushData, stored);
  if (!metadata) return;

  if (collectiblePreviewIsLastResort(metadata) && stored) {
    const name = metadata.name;
    const openseaCollection = metadata.openseaCollection;
    if ((!name || stored.name === name) && (!openseaCollection || stored.openseaCollection === openseaCollection)) {
      return;
    }

    records[slug] = stripUndefinedProps({ ...stored, name, openseaCollection });

    return;
  }

  records[slug] = metadata;
};
