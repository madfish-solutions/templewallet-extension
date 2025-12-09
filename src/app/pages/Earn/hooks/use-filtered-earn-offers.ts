import { useCallback, useMemo, useState } from 'react';

import { useDebounce } from 'use-debounce';

import { isSearchStringApplicable } from 'lib/utils/search-items';

import { SAVINGS_OFFERS, EXTERNAL_OFFERS } from '../config';
import { EarnOffer } from '../types';

export const useFilteredEarnOffers = () => {
  const [searchValue, setSearchValue] = useState('');

  const [searchValueDebounced] = useDebounce(searchValue, 300);
  const inSearch = isSearchStringApplicable(searchValueDebounced);

  const filterBySymbol = useCallback(
    (offers: EarnOffer[]) => {
      if (!inSearch) return offers;

      const query = searchValueDebounced.trim().toLowerCase();

      return offers.filter(({ symbol }) => symbol.toLowerCase().includes(query));
    },
    [inSearch, searchValueDebounced]
  );

  const savingsOffers = useMemo(() => filterBySymbol(SAVINGS_OFFERS), [filterBySymbol]);
  const externalOffers = useMemo(() => filterBySymbol(EXTERNAL_OFFERS), [filterBySymbol]);

  return {
    savingsOffers,
    externalOffers,
    searchValue,
    setSearchValue
  };
};
