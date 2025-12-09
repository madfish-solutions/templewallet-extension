import { useCallback, useMemo, useState } from 'react';

import { useDebounce } from 'use-debounce';

import { isSearchStringApplicable } from 'lib/utils/search-items';

import { SAVINGS_OFFERS, EXTERNAL_OFFERS } from '../config';
import { EarnOffer } from '../types';

export const useFilteredEarnOffers = () => {
  const [searchValue, setSearchValue] = useState('');

  const [searchValueDebounced] = useDebounce(searchValue, 300);
  const inSearch = isSearchStringApplicable(searchValueDebounced);

  const filterByName = useCallback(
    (offers: EarnOffer[]) => {
      if (!inSearch) return offers;

      const query = searchValueDebounced.trim().toLowerCase();

      return offers.filter(({ name }) => name.toLowerCase().includes(query));
    },
    [inSearch, searchValueDebounced]
  );

  const savingsOffers = useMemo(() => filterByName(SAVINGS_OFFERS), [filterByName]);

  const externalOffers = useMemo(() => filterByName(EXTERNAL_OFFERS), [filterByName]);

  return {
    savingsOffers,
    externalOffers,
    searchValue,
    setSearchValue
  };
};

