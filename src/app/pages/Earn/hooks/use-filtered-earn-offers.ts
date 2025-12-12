import { useCallback, useMemo, useState } from 'react';

import { useDebounce } from 'use-debounce';

import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { TempleAccountType } from 'lib/temple/types';
import { isSearchStringApplicable } from 'lib/utils/search-items';
import { getAccountAddressForEvm, getAccountAddressForTezos } from 'temple/accounts';
import { useAccount } from 'temple/front';

import { getTezSavingOffer, ETH_SAVING_OFFER, EXTERNAL_OFFERS } from '../config';
import { EarnOffer } from '../types';

export const useFilteredEarnOffers = () => {
  const [searchValue, setSearchValue] = useState('');

  const [searchValueDebounced] = useDebounce(searchValue, 300);
  const inSearch = isSearchStringApplicable(searchValueDebounced);

  const account = useAccount();
  const isTestnetMode = useTestnetModeEnabledSelector();

  const filterBySymbol = useCallback(
    (offers: EarnOffer[]) => {
      if (!inSearch) return offers;

      const query = searchValueDebounced.trim().toLowerCase();

      return offers.filter(({ symbol }) => symbol.toLowerCase().includes(query));
    },
    [inSearch, searchValueDebounced]
  );

  const availableSavingsOffers = useMemo(() => {
    const tezPkh = getAccountAddressForTezos(account);
    const evmPkh = getAccountAddressForEvm(account);
    const tezSavingOffer = getTezSavingOffer(isTestnetMode);

    if (account.type === TempleAccountType.WatchOnly || (!tezPkh && isTestnetMode)) return [];
    if (!tezPkh && !isTestnetMode) return [ETH_SAVING_OFFER];
    if (!evmPkh || isTestnetMode) return [tezSavingOffer];

    return [tezSavingOffer, ETH_SAVING_OFFER];
  }, [account, isTestnetMode]);

  const searchedSavingsOffers = useMemo(
    () => filterBySymbol(availableSavingsOffers),
    [availableSavingsOffers, filterBySymbol]
  );
  const externalOffers = useMemo(() => filterBySymbol(EXTERNAL_OFFERS), [filterBySymbol]);

  return {
    savingsOffers: searchedSavingsOffers,
    externalOffers,
    searchValue,
    setSearchValue
  };
};
