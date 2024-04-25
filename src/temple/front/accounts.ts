import { useMemo } from 'react';

import { uniqBy } from 'lodash';

import { useAllAccounts } from 'lib/temple/front/ready';
import { StoredAccount, TempleAccountType } from 'lib/temple/types';
import { searchAndFilterItems } from 'lib/utils/search-items';

export function searchAndFilterAccounts(accounts: StoredAccount[], searchValue: string) {
  const textSearchItems = searchAndFilterItems(
    accounts,
    searchValue.toLowerCase(),
    [{ name: 'name', weight: 1 }],
    null,
    0.35
  );

  const addressMatchItems = accounts.filter(acc => {
    switch (acc.type) {
      case TempleAccountType.ManagedKT:
      case TempleAccountType.Ledger:
        return acc.tezosAddress === searchValue;
      case TempleAccountType.HD:
        return acc.tezosAddress === searchValue || acc.evmAddress === searchValue;
      default:
        return acc.address === searchValue;
    }
  });

  return uniqBy([...textSearchItems, ...addressMatchItems], 'id');
}

/** Filters out Tezos accounts, irrelevant for given Chain ID */
export function useRelevantAccounts(tezosChainId: string) {
  const allAccounts = useAllAccounts();

  return useMemo(
    () =>
      allAccounts.filter(acc => {
        if (!acc.isVisible) {
          return false;
        }

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
