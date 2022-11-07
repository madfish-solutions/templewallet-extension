import { useCallback, useEffect, useState } from 'react';

import { getExchangeRate } from '../../../../../../lib/utorg-api';
import { booleanSetter } from '../config';

export const useExchangeRate = (inputAmount = 0, inputCurrency: string, setLoading: booleanSetter) => {
  const [exchangeRate, setExchangeRate] = useState(0);

  const updateExchangeRateRequest = useCallback(() => {
    setLoading(true);
    getExchangeRate(inputAmount, inputCurrency)
      .then(exchangeRate => setExchangeRate(exchangeRate))
      .finally(() => setLoading(false));
  }, [inputAmount, inputCurrency, setLoading]);

  useEffect(() => {
    updateExchangeRateRequest();
  }, [updateExchangeRateRequest]);

  return exchangeRate;
};
