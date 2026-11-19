import { getAddress, isAddress } from 'viem';

import { InventoryCollectionRef, InventoryContractRef } from './place-collections';

const ALCHEMY_CONTRACT_FILTER_LIMIT = 45;
const NAME_QUERY_MIN_LENGTH = 3;

interface DirectContractSearch {
  address: HexString;
  tokenId?: string;
}

/** A query that names one contract, optionally with a token id (`address` or `address_id`). */
export const directContractSearch = (query: string): DirectContractSearch | undefined => {
  const match = query.trim().match(/^(0x[a-fA-F0-9]{40})(?:_(\d+))?$/);
  const address = match?.[1];
  if (!address || !isAddress(address)) return undefined;

  return { address: getAddress(address), tokenId: match[2] };
};

const uniqueAddresses = (addresses: readonly string[], accept: (address: string) => boolean) => {
  const selected: string[] = [];
  const seen = new Set<string>();

  for (const address of addresses) {
    if (selected.length >= ALCHEMY_CONTRACT_FILTER_LIMIT) break;

    const key = address.toLowerCase();
    if (seen.has(key) || !accept(address)) continue;

    seen.add(key);
    selected.push(address);
  }

  return selected;
};

/**
 * Contracts to ask Alchemy about for a query that is not one exact address.
 * Names come from contracts already loaded for this account. A contract that
 * hosts more than one known collection is skipped: one page of that contract
 * mixes those collections.
 */
export const alchemyContractAddressesForSearch = (
  query: string,
  contracts: readonly InventoryContractRef[],
  collections: readonly InventoryCollectionRef[]
): string[] => {
  if (directContractSearch(query)) return [];

  const trimmed = query.trim();
  const prefix = /^0x[a-fA-F0-9]{8,39}$/.test(trimmed) ? trimmed.toLowerCase() : undefined;
  const storedAddresses = contracts
    .map(contract => contract.address)
    .concat(collections.flatMap(collection => collection.contractAddresses));

  if (prefix) return uniqueAddresses(storedAddresses, address => address.toLowerCase().startsWith(prefix));
  if (trimmed.length < NAME_QUERY_MIN_LENGTH) return [];

  const needle = trimmed.toLowerCase();
  const collectionsByAddress = new Map<string, number>();

  for (const collection of collections) {
    for (const address of collection.contractAddresses) {
      const key = address.toLowerCase();
      collectionsByAddress.set(key, (collectionsByAddress.get(key) ?? 0) + 1);
    }
  }

  const named = contracts
    .filter(contract => contract.name?.toLowerCase().includes(needle))
    .map(contract => contract.address)
    .concat(
      collections
        .filter(collection => collection.name.toLowerCase().includes(needle))
        .flatMap(collection => collection.contractAddresses)
    );

  return uniqueAddresses(named, address => (collectionsByAddress.get(address.toLowerCase()) ?? 0) <= 1);
};
