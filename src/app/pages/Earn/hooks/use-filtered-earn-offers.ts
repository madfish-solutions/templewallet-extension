import { useMemo, useState } from 'react';

import { useDebounce } from 'use-debounce';

import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { DAppForDeposit, DAPPS_FOR_DEPOSITS } from 'lib/dapps-for-deposit';
import { TempleAccountType } from 'lib/temple/types';
import { isSearchStringApplicable } from 'lib/utils/search-items';
import { getAccountAddressForEvm, getAccountAddressForTezos } from 'temple/accounts';
import { useAccount } from 'temple/front';

import { getTezSavingOffer, EXTERNAL_OFFERS, getEthSavingOffer } from '../config';
import { EarnOffer } from '../types';

export const useFilteredEarnOffers = () => {
  const [searchValue, setSearchValue] = useState('');

  const [searchValueDebounced] = useDebounce(searchValue, 300);
  const inSearch = isSearchStringApplicable(searchValueDebounced);

  const account = useAccount();
  const isTestnetMode = useTestnetModeEnabledSelector();

  const filterBySymbol = useMemo(
    () =>
      <T extends EarnOffer | DAppForDeposit>(offers: T[]) => {
        if (!inSearch) return offers;
        const query = searchValueDebounced.trim().toLowerCase();

        return offers.filter(offer =>
          ('description' in offer ? offer.name : offer.symbol).toLowerCase().includes(query)
        );
      },
    [inSearch, searchValueDebounced]
  );

  const availableSavingsOffers = useMemo(() => {
    const tezPkh = getAccountAddressForTezos(account);
    const evmPkh = getAccountAddressForEvm(account);

    const tezSavingOffer = getTezSavingOffer(isTestnetMode);
    const ethSavingOffer = getEthSavingOffer(isTestnetMode);

    if (account.type === TempleAccountType.WatchOnly) return [];
    if (!tezPkh) return [ethSavingOffer];
    if (!evmPkh) return [tezSavingOffer];

    return [tezSavingOffer, ethSavingOffer];
  }, [account, isTestnetMode]);

  const searchedSavingsOffers = useMemo(
    () => filterBySymbol(availableSavingsOffers),
    [availableSavingsOffers, filterBySymbol]
  );
  const externalOffers = useMemo(() => filterBySymbol(EXTERNAL_OFFERS), [filterBySymbol]);
  const dAppsForDeposits = useMemo(() => filterBySymbol(DAPPS_FOR_DEPOSITS), [filterBySymbol]);

  return {
    savingsOffers: searchedSavingsOffers,
    externalOffers,
    dAppsForDeposits,
    searchValue,
    setSearchValue
  };
};
