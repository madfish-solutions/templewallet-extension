import { AssetSlugStoredAssetRecord, ChainIdTokenSlugsAssetsRecord } from 'app/store/evm/assets/state';
import { isOpenseaChainId } from 'app/store/evm/collectibles-inventory/chains';
import { OPENSEA_MULTICHAIN_NFTS_LIMIT, OpenseaNftRef } from 'lib/apis/temple/endpoints/evm';
import { fromAssetSlug, parseChainAssetSlug, toTokenSlug } from 'lib/assets/utils';
import { previewUrlIsOpenseaHosted } from 'lib/metadata/collectible-media';
import { TempleChainKind } from 'temple/types';

import { collectiblePreviewIsLastResort } from './opensea-preview';
import { sharedStorefrontFillInFlight } from './opensea-storefront';
import { EvmCollectibleMetadataRecord } from './state';
import { isSharedStorefrontTokenId, sharedStorefrontCreatorAddress, singleContractCollectionNames } from './utils';

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
    if (chainKind !== TempleChainKind.EVM || typeof chainId !== 'number' || !isOpenseaChainId(chainId)) return;

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
    if (!isOpenseaChainId(chainId)) continue;

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
    if (!isOpenseaChainId(chainId)) continue;

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
    if (!isOpenseaChainId(chainId)) continue;

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
