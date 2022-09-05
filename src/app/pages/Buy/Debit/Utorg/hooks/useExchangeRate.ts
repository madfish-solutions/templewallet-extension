import { useCallback, useEffect, useState } from 'react';

import { getExchangeRate } from '../../../../../../lib/utorg-api';
import { booleanSetter } from '../config';

export const useExchangeRate = (
  inputAmount: number,
  inputCurrency: string,
  setLoading: booleanSetter,
  setIsApiError: booleanSetter
) => {
  const [exchangeRate, setExchangeRate] = useState(0);

  const updateExchangeRateRequest = useCallback(() => {
    setLoading(true);
    getExchangeRate(inputAmount, inputCurrency)
      .then(exchangeRate => {
        setExchangeRate(exchangeRate);
        setLoading(false);
      })
      .catch(() => {
        setIsApiError(true);
        setLoading(false);
      });
  }, [inputAmount, inputCurrency, setIsApiError, setLoading]);

  useEffect(() => {
    updateExchangeRateRequest();
  }, [updateExchangeRateRequest]);

  return exchangeRate;
};
