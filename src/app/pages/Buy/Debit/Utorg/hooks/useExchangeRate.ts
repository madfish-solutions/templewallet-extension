import { useCallback, useEffect, useState } from 'react';

import { getExchangeRate } from '../../../../../../lib/utorg-api';
import { booleanSetter } from '../config';

export const useExchangeRate = (inputCurrency: string, setLoading: booleanSetter, setIsApiError: booleanSetter) => {
  const [exchangeRate, setExchangeRate] = useState(0);

  const updateExchangeRateRequest = useCallback(() => {
    setLoading(true);
    getExchangeRate(inputCurrency)
      .then(exchangeRate => {
        setExchangeRate(exchangeRate);
        setLoading(false);
      })
      .catch(() => {
        setIsApiError(true);
        setLoading(false);
      });
  }, [inputCurrency, setIsApiError, setLoading]);

  useEffect(() => {
    updateExchangeRateRequest();
  }, [updateExchangeRateRequest]);

  return exchangeRate;
};
