import { useMemo } from 'react';

import { StoredAccount, TempleAccountType } from 'lib/temple/types';
import { searchAndFilterItems } from 'lib/utils/search-items';

import { useAllAccounts } from './ready';

export function searchAndFilterAccounts(accounts: StoredAccount[], searchValue: string) {
  const searchValueTrimmed = searchValue.trim();
  const addressMatchItems = accounts.filter(acc => {
    switch (acc.type) {
      case TempleAccountType.ManagedKT:
        return acc.tezosAddress === searchValueTrimmed;
      case TempleAccountType.HD:
        return acc.tezosAddress === searchValueTrimmed || acc.evmAddress === searchValueTrimmed;
      default:
        return acc.address === searchValueTrimmed;
    }
  });

  if (addressMatchItems.length) return addressMatchItems;

  return searchAndFilterItems(accounts, searchValue.toLowerCase(), [{ name: 'name', weight: 1 }], null, 0.35);
}

/** Filters out Tezos accounts, irrelevant for given Chain ID */
export function useRelevantAccounts(tezosChainId: string) {
  const allAccounts = useAllAccounts();

  return useMemo(
    () =>
      allAccounts.filter(acc => {
        switch (acc.type) {
          case TempleAccountType.ManagedKT:
            return (
              Boolean(acc.tezosAddress) && // To know if logic (interface) remained
              acc.chainId === tezosChainId
            );

          case TempleAccountType.WatchOnly:
            return acc.chain === 'tezos' ? !acc.chainId || acc.chainId === tezosChainId : true;

          default:
            return true;
        }
      }),
    [tezosChainId, allAccounts]
  );
}

export function useVisibleAccounts() {
  const allAccounts = useAllAccounts();

  return useMemo(() => allAccounts.filter(acc => !acc.hidden), [allAccounts]);
}
