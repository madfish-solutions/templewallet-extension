import { getAddress } from 'viem';

import { NftAddressBalanceNftResponse } from 'lib/apis/temple/endpoints/evm';
import { toTokenSlug } from 'lib/assets';
import { EvmAssetStandard } from 'lib/evm/types';
import { EvmCollectibleMetadata } from 'lib/metadata/types';
import { isProperCollectibleMetadata } from 'lib/utils/evm.utils';

import { buildEvmCollectibleMetadataFromFetched } from '../collectibles-metadata/utils';

import { InventoryContractRef, InventoryLoadedNft } from './place-collections';

interface CollectedInventoryNfts {
  records: StringRecord<EvmCollectibleMetadata>;
  loaded: InventoryLoadedNft[];
  slugs: string[];
}

interface GoldrushInventory {
  collected: CollectedInventoryNfts;
  contracts: InventoryContractRef[];
}

const emptyCollected = (): CollectedInventoryNfts => ({ records: {}, loaded: [], slugs: [] });

const standardOf = (supported: readonly string[]) => {
  if (supported.some(erc => erc === EvmAssetStandard.ERC721)) return EvmAssetStandard.ERC721;
  if (supported.some(erc => erc === EvmAssetStandard.ERC1155)) return EvmAssetStandard.ERC1155;

  return undefined;
};

/** Goldrush tokens and one contract card per contract that has a token id. */
export const inventoryFromGoldrush = (data: NftAddressBalanceNftResponse): GoldrushInventory => {
  const collected = emptyCollected();
  const contracts: InventoryContractRef[] = [];

  for (const item of data.items) {
    let address: HexString;
    try {
      address = getAddress(item.contract_address);
    } catch {
      continue;
    }

    const slugsBefore = collected.slugs.length;

    for (const nft of item.nft_data) {
      if (!nft.token_id) continue;

      const slug = toTokenSlug(address, nft.token_id);
      if (collected.records[slug]) continue;

      collected.records[slug] = isProperCollectibleMetadata(nft)
        ? buildEvmCollectibleMetadataFromFetched(nft, item)
        : {
            address,
            tokenId: nft.token_id,
            standard: standardOf(item.supports_erc),
            name: item.contract_name || undefined
          };
      collected.loaded.push({ slug, contractAddress: address });
      collected.slugs.push(slug);
    }

    const added = collected.slugs.length - slugsBefore;
    if (!added) continue;

    const imageUrl = collected.slugs
      .slice(slugsBefore)
      .map(slug => collected.records[slug]?.image)
      .find(Boolean);

    contracts.push({
      address,
      name: item.contract_name || undefined,
      distinctTokensOwned: added,
      imageUrl
    });
  }

  return { collected, contracts };
};

/**
 * Drops tokens the sample proved unowned.
 * A contract count shrinks with them, and a contract left at zero is removed.
 */
export const withoutProvenUnowned = (
  collected: CollectedInventoryNfts,
  contracts: readonly InventoryContractRef[],
  unownedSlugs: readonly string[],
  unownedContracts: readonly string[] = []
) => {
  const unowned = new Set(unownedSlugs);
  const emptyContracts = new Set(unownedContracts.map(address => address.toLowerCase()));
  if (!unowned.size && !emptyContracts.size)
    return { collected, contracts: contracts.slice(), removed: 0, droppedContracts: 0 };

  const loadedByContract = new Map<string, number>();
  for (const nft of collected.loaded) {
    const key = nft.contractAddress.toLowerCase();
    loadedByContract.set(key, (loadedByContract.get(key) ?? 0) + 1);
  }

  const removedByContract = new Map<string, number>();
  const removedSlugs = new Set<string>();
  const loaded = collected.loaded.filter(nft => {
    const key = nft.contractAddress.toLowerCase();
    if (emptyContracts.has(key) || unowned.has(nft.slug)) {
      removedSlugs.add(nft.slug);
      if (!emptyContracts.has(key)) removedByContract.set(key, (removedByContract.get(key) ?? 0) + 1);

      return false;
    }

    return true;
  });
  const records = { ...collected.records };
  for (const slug of removedSlugs) delete records[slug];

  let removed = 0;
  const seenContracts = new Set<string>();
  const nextContracts = contracts.flatMap(contract => {
    const key = contract.address.toLowerCase();
    seenContracts.add(key);

    if (emptyContracts.has(key)) {
      removed += Math.max(contract.distinctTokensOwned, loadedByContract.get(key) ?? 0);

      return [];
    }

    const slugRemovals = removedByContract.get(key) ?? 0;
    if (!slugRemovals) return [contract];

    removed += slugRemovals;
    const distinctTokensOwned = contract.distinctTokensOwned - slugRemovals;
    if (distinctTokensOwned <= 0) return [];

    return [{ ...contract, distinctTokensOwned }];
  });

  for (const [key, count] of loadedByContract) {
    if (emptyContracts.has(key) && !seenContracts.has(key)) removed += count;
  }

  return {
    collected: {
      records,
      loaded,
      slugs: collected.slugs.filter(slug => !removedSlugs.has(slug))
    },
    contracts: nextContracts,
    removed,
    droppedContracts: contracts.length - nextContracts.length
  };
};
