import { useCallback, useEffect, useState } from 'react';

import { getCurrenciesCount } from '../exolix.util';

export const useCurrenciesCount = () => {
  const [currenciesCount, setCurrenciesCount] = useState('');

  const updateCurrenciesCount = useCallback(async () => {
    const count = await getCurrenciesCount();
    if (count) {
      setCurrenciesCount(count.toString());
    }
  }, []);

  useEffect(() => void updateCurrenciesCount(), [updateCurrenciesCount]);

  return currenciesCount;
};
