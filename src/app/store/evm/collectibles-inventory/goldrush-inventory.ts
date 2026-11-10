import { getAddress } from 'viem';

import { NftAddressBalanceNftResponse } from 'lib/apis/temple/endpoints/evm';
import { toTokenSlug } from 'lib/assets';
import { EvmAssetStandard } from 'lib/evm/types';
import { EvmCollectibleMetadata } from 'lib/metadata/types';
import { isProperCollectibleMetadata } from 'lib/utils/evm.utils';

import { buildEvmCollectibleMetadataFromFetched } from '../collectibles-metadata/utils';

import { InventoryContractRef, InventoryLoadedNft } from './place-collections';

export interface CollectedInventoryNfts {
  records: StringRecord<EvmCollectibleMetadata>;
  loaded: InventoryLoadedNft[];
  slugs: string[];
}

export interface GoldrushInventory {
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
  unownedSlugs: readonly string[]
) => {
  const unowned = new Set(unownedSlugs);
  if (!unowned.size) return { collected, contracts: contracts.slice(), removed: 0, droppedContracts: 0 };

  const removedByContract = new Map<string, number>();
  const loaded = collected.loaded.filter(nft => {
    if (!unowned.has(nft.slug)) return true;

    const key = nft.contractAddress.toLowerCase();
    removedByContract.set(key, (removedByContract.get(key) ?? 0) + 1);

    return false;
  });
  const records = { ...collected.records };
  for (const slug of unowned) delete records[slug];

  const nextContracts = contracts.flatMap(contract => {
    const removed = removedByContract.get(contract.address.toLowerCase()) ?? 0;
    if (!removed) return [contract];

    const distinctTokensOwned = contract.distinctTokensOwned - removed;
    if (distinctTokensOwned <= 0) return [];

    return [{ ...contract, distinctTokensOwned }];
  });

  return {
    collected: {
      records,
      loaded,
      slugs: collected.slugs.filter(slug => !unowned.has(slug))
    },
    contracts: nextContracts,
    removed: collected.loaded.length - loaded.length,
    droppedContracts: contracts.length - nextContracts.length
  };
};
