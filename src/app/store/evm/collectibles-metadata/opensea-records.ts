import { isOpenseaChainId } from 'app/store/evm/collectibles-inventory/chains';
import {
  getOpenseaChainNftsMetadata,
  NftAddressBalanceNftResponse,
  OpenseaNftDetailed,
  OpenseaNftRef
} from 'lib/apis/temple/endpoints/evm';
import { readRetryAfterMs } from 'lib/apis/utils';
import { EvmCollectibleMetadata } from 'lib/metadata/types';
import { stripUndefinedProps } from 'lib/utils';

import { collectiblePreviewIsLastResort, promotePreferredPreview } from './opensea-preview';
import {
  applyGoldrushContractIdentity,
  buildEvmCollectibleMetadataFromOpensea,
  collectibleCollectionName,
  findGoldrushCollectibleForSlug,
  indexCollectibleSlugs,
  isOpenseaNftForRef,
  isSharedStorefrontTokenId,
  lookupCollectibleSlug
} from './utils';

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
  if (!isOpenseaChainId(chainId)) return { nfts: [] };

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
