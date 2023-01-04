import { useMemo, useState } from 'react';

import { useDebounce } from 'use-debounce';

import { CurrencyBase } from './types';

export const getProperNetworkFullName = (currency?: CurrencyBase) => {
  if (currency == null || !currency.network?.fullName) return '';
  const { fullName: networkFullName } = currency.network;

  return currency.name === networkFullName ? networkFullName + ' Mainnet' : networkFullName;
};

export const useFilteredCurrencies = (currencies: CurrencyBase[]) => {
  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const filteredCurrencies = useMemo<CurrencyBase[]>(() => {
    if (searchValueDebounced) {
      const lowerCaseSearchValue = searchValueDebounced.toLowerCase();
      const result: CurrencyBase[] = [];

      for (const currency of currencies) {
        const { name, code } = currency;

        if (name?.toLowerCase().includes(lowerCaseSearchValue) || code.toLowerCase().includes(lowerCaseSearchValue)) {
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
