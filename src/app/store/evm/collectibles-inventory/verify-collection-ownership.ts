import { getAddress } from 'viem';

import { isOpenseaChainId } from 'app/store/evm/collectibles-inventory/chains';
import {
  attributeOwnedToken,
  collectionOwnedCount,
  OwnershipCandidate,
  OwnershipSource,
  reconcileOwnership,
  tokenIdKey
} from 'app/store/evm/collectibles-inventory/ownership';
import { InventoryCollectionRef, InventoryLoadedNft } from 'app/store/evm/collectibles-inventory/place-collections';
import { collectiblePreviewIsLastResort } from 'app/store/evm/collectibles-metadata/opensea-preview';
import {
  isSharedStorefrontTokenId,
  buildEvmCollectibleMetadataFromOpensea
} from 'app/store/evm/collectibles-metadata/utils';
import { getOpenseaMultichainNftsMetadata, OPENSEA_MULTICHAIN_NFTS_LIMIT } from 'lib/apis/temple/endpoints/evm';
import { isAbortError, withRateLimitRetry } from 'lib/apis/utils';
import { fromAssetSlug, toTokenSlug } from 'lib/assets';
import { readContractNftOwnership } from 'lib/evm/on-chain/nft-ownership';
import { previewUrlIsOpenseaHosted } from 'lib/metadata/collectible-media';
import { EvmCollectibleMetadata } from 'lib/metadata/types';
import { getEvmChainsActiveRpcUrls } from 'temple/evm/evm-chains-rpc-urls';
import { EVM_DEFAULT_NETWORKS, EvmNetworkEssentials } from 'temple/networks';

export interface ReportedCollectible {
  slug: string;
  contractAddress: string;
  tokenId: string;
  source: OwnershipSource;
  /** Set only when OpenSea named this token's collection. Alchemy's contract slug is not one. */
  openseaCollection?: string;
  /** Slug a source already stored. Kept only when it is one of this account's collections. */
  collectionSlug?: string;
  /** Balance the API already reported. Used when the chain call does not return one. */
  balance?: string;
}

interface VerifiedCollectionOwnership {
  upsert: InventoryLoadedNft[];
  removeSlugs: string[];
  collectionCounts: Array<{ slug: string; itemCount: number }>;
  metadata: StringRecord<EvmCollectibleMetadata>;
}

const contractKey = (address: string) => {
  try {
    return getAddress(address).toLowerCase();
  } catch {
    return address.toLowerCase();
  }
};

const identityOf = (contractAddress: string, tokenId: string) =>
  `${contractKey(contractAddress)}:${tokenIdKey(tokenId)}`;

const identityOfSlug = (slug: string) => {
  const [contract, tokenId] = fromAssetSlug(slug);

  return identityOf(contract, tokenId ?? '0');
};

const networkForChain = async (chainId: number): Promise<EvmNetworkEssentials | null> => {
  const active = await getEvmChainsActiveRpcUrls();
  const rpcBaseURL = active[chainId] ?? EVM_DEFAULT_NETWORKS.find(network => network.chainId === chainId)?.rpcBaseURL;

  return rpcBaseURL ? { chainId, rpcBaseURL } : null;
};

const collectionsForContract = (collections: readonly InventoryCollectionRef[], address: string) =>
  collections.filter(collection =>
    collection.contractAddresses.some(item => contractKey(item) === contractKey(address))
  );

/**
 * Decides which reported token ids the account owns.
 * `ownerOf` / ERC-1155 `balanceOf` reject API extras. The balance counter and an on-chain listing fill ids the APIs missed.
 */
export const verifyCollectionOwnership = async (
  account: HexString,
  chainId: number,
  contractAddresses: readonly string[],
  reported: readonly ReportedCollectible[],
  queriedSources: readonly OwnershipSource[],
  /** OpenSea account page: a listed token counts, a missing token does not count against it. */
  partialSources: readonly OwnershipSource[],
  stored: readonly InventoryLoadedNft[],
  collections: readonly InventoryCollectionRef[],
  signal: AbortSignal
): Promise<VerifiedCollectionOwnership | null> => {
  const network = await networkForChain(chainId);
  if (!network) return null;

  const contracts = Array.from(new Set(contractAddresses.map(contractKey)));
  const reportsByContract = new Map<string, ReportedCollectible[]>();
  for (const report of reported) {
    const key = contractKey(report.contractAddress);
    const group = reportsByContract.get(key) ?? [];
    group.push(report);
    reportsByContract.set(key, group);
  }

  const candidatesByContract = new Map(
    contracts.map(contract => [contract, candidatesFor(reportsByContract.get(contract) ?? [])])
  );
  const ownedByContract = new Map<string, { tokenIds: string[]; balanceOf: number | null; settled: boolean }>();
  let read: Awaited<ReturnType<typeof readContractNftOwnership>>;

  try {
    read = await readContractNftOwnership(
      network,
      account,
      contracts.map(contract => ({
        contract,
        tokenIds: (candidatesByContract.get(contract) ?? []).map(candidate => candidate.tokenId)
      })),
      signal
    );
  } catch (error) {
    if (isAbortError(error)) throw error;
    console.error(error);
    read = { facts: new Map(), failed: new Set(contracts) };
  }

  for (const contract of contracts) {
    const candidates = candidatesByContract.get(contract) ?? [];
    const facts = read.facts.get(contract);

    if (!facts || read.failed.has(contract)) {
      ownedByContract.set(contract, {
        tokenIds: candidates.map(candidate => candidate.tokenId),
        balanceOf: null,
        settled: false
      });
      continue;
    }

    const reconciled = reconcileOwnership({
      candidates,
      queriedSources,
      partialSources,
      chain: facts
    });
    ownedByContract.set(contract, {
      tokenIds: reconciled.ownedTokenIds,
      balanceOf: facts.balanceOf,
      settled: reconciled.chainSettled
    });
  }

  const reportedBalanceByIdentity = new Map<string, string>();
  for (const report of reported) {
    if (!report.balance) continue;

    const id = identityOf(report.contractAddress, report.tokenId);
    if (!reportedBalanceByIdentity.has(id)) reportedBalanceByIdentity.set(id, report.balance);
  }

  const openseaSlugByIdentity = new Map<string, string>();
  const hintedSlugsByIdentity = new Map<string, string[]>();
  for (const report of reported) {
    const id = identityOf(report.contractAddress, report.tokenId);
    if (report.openseaCollection) openseaSlugByIdentity.set(id, report.openseaCollection);
    if (!report.collectionSlug) continue;
    const hints = hintedSlugsByIdentity.get(id) ?? [];
    hints.push(report.collectionSlug);
    hintedSlugsByIdentity.set(id, hints);
  }

  const metadataByIdentity = new Map<string, EvmCollectibleMetadata>();
  if (isOpenseaChainId(chainId)) {
    const missing = contracts.flatMap(contract => {
      const owned = ownedByContract.get(contract);
      if (!owned) return [];

      return owned.tokenIds.flatMap(tokenId => {
        const id = identityOf(contract, tokenId);
        if (openseaSlugByIdentity.has(id)) return [];

        return [{ contract, tokenId }];
      });
    });

    if (missing.length) {
      try {
        const refs = missing.slice(0, OPENSEA_MULTICHAIN_NFTS_LIMIT).map(({ contract, tokenId }) => ({
          chainId,
          contractAddress: getAddress(contract),
          tokenId
        }));
        const nfts = await withRateLimitRetry(() => getOpenseaMultichainNftsMetadata(refs, signal), signal);
        nfts.forEach((nft, index) => {
          const ref = refs[index];
          if (!nft?.collection || !ref) return;

          const id = identityOf(ref.contractAddress, ref.tokenId);
          openseaSlugByIdentity.set(id, nft.collection);
          const storefront = isSharedStorefrontTokenId(nft.identifier);
          metadataByIdentity.set(id, {
            ...buildEvmCollectibleMetadataFromOpensea(nft, ref.contractAddress, tokenIdKey(ref.tokenId)),
            name: nft.collection,
            openseaCollection: storefront ? nft.collection : undefined,
            collectibleName: nft.name || undefined
          });
        });
      } catch (error) {
        if (isAbortError(error)) throw error;
        console.error(error);
      }
    }
  }

  const storedSlugByIdentity = new Map(stored.map(nft => [identityOfSlug(nft.slug), nft.slug]));
  const upsert: InventoryLoadedNft[] = [];
  const metadata: StringRecord<EvmCollectibleMetadata> = {};
  const ownedIdentities = new Set<string>();

  for (const [contract, owned] of ownedByContract) {
    let checksum = contract;
    try {
      checksum = getAddress(contract);
    } catch {
      continue;
    }
    const accountSlugs = collectionsForContract(collections, contract).map(collection => collection.slug);

    for (const tokenId of owned.tokenIds) {
      const id = identityOf(checksum, tokenId);
      ownedIdentities.add(id);
      const slug = storedSlugByIdentity.get(id) ?? toTokenSlug(checksum, tokenId);
      const record = metadataByIdentity.get(id);
      if (record) metadata[slug] = record;
      const reportedSlug = (hintedSlugsByIdentity.get(id) ?? []).find(hint => accountSlugs.includes(hint));
      const balance = read.facts.get(contract)?.perTokenBalance.get(tokenId) ?? reportedBalanceByIdentity.get(id);
      upsert.push({
        slug,
        contractAddress: checksum,
        collectionSlug: attributeOwnedToken(openseaSlugByIdentity.get(id), accountSlugs, reportedSlug),
        balance
      });
    }
  }

  const removeSlugs = stored.flatMap(nft => {
    const key = contractKey(nft.contractAddress);
    const owned = ownedByContract.get(key);
    if (!owned?.settled) return [];
    if (ownedIdentities.has(identityOfSlug(nft.slug))) return [];

    return [nft.slug];
  });

  const collectionCounts = collections.flatMap(collection => {
    const addresses = collection.contractAddresses.map(contractKey);
    if (!addresses.every(address => contracts.includes(address))) return [];
    if (!addresses.every(address => ownedByContract.get(address)?.settled)) return [];

    const itemCount = addresses.reduce((sum, address) => {
      const owned = ownedByContract.get(address);
      const sole = collectionsForContract(collections, address).length === 1;
      const attributed = upsert.filter(
        nft => nft.collectionSlug === collection.slug && contractKey(nft.contractAddress) === address
      ).length;

      return sum + collectionOwnedCount(attributed, owned?.balanceOf ?? null, sole);
    }, 0);

    return [{ slug: collection.slug, itemCount }];
  });

  return { upsert, removeSlugs, collectionCounts, metadata };
};

const previewUrl = (metadata: EvmCollectibleMetadata) => metadata.images?.[0] ?? metadata.image;

/**
 * Keeps an Alchemy record and fills what it does not have from OpenSea.
 * An OpenSea CDN image is kept. Any other OpenSea image is used only when Alchemy's preview is a last resort.
 */
export const mergeCollectibleMetadata = (
  reported: EvmCollectibleMetadata | undefined,
  opensea: EvmCollectibleMetadata | undefined
): EvmCollectibleMetadata | undefined => {
  if (!opensea) return reported;
  if (!reported) return opensea;

  const openseaUrl = previewUrl(opensea);
  const openseaIsPreferred = Boolean(openseaUrl) && !collectiblePreviewIsLastResort(opensea);
  const useOpenseaPreview = Boolean(
    openseaUrl &&
    (previewUrlIsOpenseaHosted(openseaUrl) || (openseaIsPreferred && collectiblePreviewIsLastResort(reported)))
  );

  return {
    ...reported,
    description: reported.description || opensea.description,
    collectibleName: reported.collectibleName || opensea.collectibleName,
    metadataUri: reported.metadataUri || opensea.metadataUri,
    animationUrl: reported.animationUrl || opensea.animationUrl,
    artifactUrl: reported.artifactUrl || opensea.artifactUrl,
    attributes: reported.attributes?.length ? reported.attributes : opensea.attributes,
    openseaCollection: reported.openseaCollection || opensea.openseaCollection,
    name: reported.name || opensea.name,
    image: useOpenseaPreview ? opensea.image || openseaUrl : reported.image,
    images: useOpenseaPreview ? opensea.images || (openseaUrl ? [openseaUrl] : reported.images) : reported.images
  };
};

const candidatesFor = (group: readonly ReportedCollectible[]): OwnershipCandidate[] => {
  const byToken = new Map<string, Set<OwnershipSource>>();
  for (const report of group) {
    const tokenId = tokenIdKey(report.tokenId);
    const sources = byToken.get(tokenId) ?? new Set<OwnershipSource>();
    sources.add(report.source);
    byToken.set(tokenId, sources);
  }

  return Array.from(byToken, ([tokenId, sources]) => ({ tokenId, sources: Array.from(sources) }));
};
