import { getAddress } from 'viem';

import { NftAddressBalanceNftResponse } from 'lib/apis/temple/endpoints/evm';

import { InventoryCollectionRef, InventoryContractRef } from './place-collections';

/** Goldrush contract balances for this session, keyed by account and chain. Inventory stays free of a new persisted field. */
const balancesByAccountChain = new Map<string, ReadonlyMap<string, number>>();

const accountChainKey = (account: string, chainId: number) => `${account}:${chainId}`;

const contractKey = (address: string) => {
  try {
    return getAddress(address).toLowerCase();
  } catch {
    return address.toLowerCase();
  }
};

/** A whole NFT count. A scaled or empty balance is not one. */
export const parseGoldrushContractBalance = (balance: string | null): number | undefined => {
  if (!balance || !/^\d+$/.test(balance)) return undefined;

  const parsed = Number(balance);

  return Number.isSafeInteger(parsed) ? parsed : undefined;
};

/** Contract address to the balance Goldrush returned for this account. */
export const goldrushBalanceByContract = (data: NftAddressBalanceNftResponse) => {
  const balances = new Map<string, number>();

  for (const item of data.items) {
    const balance = parseGoldrushContractBalance(item.balance);
    if (balance == null) continue;

    balances.set(contractKey(item.contract_address), balance);
  }

  return balances;
};

export const rememberGoldrushContractBalances = (
  account: string,
  chainId: number,
  balances: ReadonlyMap<string, number>
) => {
  balancesByAccountChain.set(accountChainKey(account, chainId), balances);
};

export const goldrushContractBalancesFor = (account: string, chainId: number) =>
  balancesByAccountChain.get(accountChainKey(account, chainId));

/**
 * Goldrush replaces Alchemy when it is strictly closer to the chain's ERC-721 `balanceOf`.
 * The same distance keeps Alchemy. Without a chain count, Alchemy stays.
 */
export const closerOwnedCount = (alchemy: number, goldrush: number | undefined, truth: number | null) => {
  if (goldrush == null || truth == null) return alchemy;

  return Math.abs(goldrush - truth) < Math.abs(alchemy - truth) ? goldrush : alchemy;
};

const openseaContractKeys = (collections: readonly InventoryCollectionRef[]) => {
  const keys = new Set<string>();

  for (const collection of collections) {
    for (const address of collection.contractAddresses) keys.add(contractKey(address));
  }

  return keys;
};

/**
 * Contract cards only. An OpenSea collection keeps its own `itemCount`.
 * `delta` is how far the owned-NFT total moves with the counts that changed.
 */
export const withCloserGoldrushCounts = (
  contracts: readonly InventoryContractRef[],
  collections: readonly InventoryCollectionRef[],
  goldrush: ReadonlyMap<string, number> | undefined,
  truthByContract: ReadonlyMap<string, number>
) => {
  const namedByOpensea = openseaContractKeys(collections);
  let delta = 0;
  const next = contracts.map(contract => {
    const key = contractKey(contract.address);
    if (namedByOpensea.has(key)) return contract;

    const count = closerOwnedCount(contract.distinctTokensOwned, goldrush?.get(key), truthByContract.get(key) ?? null);
    if (count === contract.distinctTokensOwned) return contract;

    delta += count - contract.distinctTokensOwned;

    return { ...contract, distinctTokensOwned: count };
  });

  return { contracts: next, delta };
};
