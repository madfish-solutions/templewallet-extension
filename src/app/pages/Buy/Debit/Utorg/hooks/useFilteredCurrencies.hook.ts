import { useMemo, useState } from 'react';

import { useDebounce } from 'use-debounce';

export const useFilteredCurrencies = (currencies: string[]) => {
  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const filteredCurrencies = useMemo<string[]>(() => {
    if (searchValueDebounced) {
      const lowerCaseSearchValue = searchValueDebounced.toLowerCase();
      const result: string[] = [];

      for (const currencyName of currencies) {
        if (currencyName.toLowerCase().includes(lowerCaseSearchValue)) {
          result.push(currencyName);
        }
      }

      return result;
    } else {
      return currencies;
    }
  }, [searchValueDebounced, currencies]);

  return {
    filteredCurrencies,
    searchValue,
    setSearchValue
  };
};
