import { useMemo, useState } from 'react';

import { useDebounce } from 'use-debounce';

import { CurrencyInterface } from '../exolix.interface';

export const useFilteredCurrencies = (currencies: CurrencyInterface[]) => {
  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const filteredCurrencies = useMemo<CurrencyInterface[]>(() => {
    if (searchValueDebounced) {
      const lowerCaseSearchValue = searchValueDebounced.toLowerCase();
      const result: CurrencyInterface[] = [];

      for (const currency of currencies) {
        const { name, code } = currency;

        if (name.toLowerCase().includes(lowerCaseSearchValue) || code.toLowerCase().includes(lowerCaseSearchValue)) {
          result.push(currency);
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
