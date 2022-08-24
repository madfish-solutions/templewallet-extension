import { useEffect, useState } from 'react';

import { getCurrenciesCount } from '../exolix.util';

export const useCurrenciesCount = () => {
  const [currenciesCount, setCurrenciesCount] = useState('');

  useEffect(() => {
    (async () => {
      const count = await getCurrenciesCount();
      if (count) {
        setCurrenciesCount(count.toString());
      }
    })();
  }, []);

  return currenciesCount;
};
