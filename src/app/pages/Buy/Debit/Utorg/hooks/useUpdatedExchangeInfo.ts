import { useCallback, useEffect, useState } from 'react';

import { getAvailableFiatCurrencies, getMinMaxExchangeValue } from 'lib/apis/utorg';

import { booleanSetter } from '../config';

export const useUpdatedExchangeInfo = (currency: string, setLoading: booleanSetter, setIsApiError: booleanSetter) => {
  const [isMinMaxLoading, setIsMinMaxLoading] = useState(false);

  const [currencies, setCurrencies] = useState<string[]>([]);
  const [minAmount, setMinAmount] = useState(0);
  const [maxAmount, setMaxAmount] = useState(NaN);

  const updateMinMaxRequest = useCallback(() => {
    setIsMinMaxLoading(true);
    getMinMaxExchangeValue(currency)
      .then(({ minAmount, maxAmount }) => {
        setMinAmount(minAmount);
        setMaxAmount(maxAmount);
        setIsMinMaxLoading(false);
      })
      .catch(error => {
        console.error(error);
        setIsApiError(true);
        setIsMinMaxLoading(false);
      });
  }, [currency, setIsApiError, setIsMinMaxLoading]);

  const updateCurrenciesRequest = useCallback(() => {
    setLoading(true);
    getAvailableFiatCurrencies()
      .then(currencies => {
        setCurrencies(currencies);
        setLoading(false);
      })
      .catch(() => {
        setIsApiError(true);
        setLoading(false);
      });
  }, [setIsApiError, setLoading]);

  useEffect(() => {
    updateMinMaxRequest();
    updateCurrenciesRequest();
  }, [updateMinMaxRequest, updateCurrenciesRequest]);

  return {
    currencies,
    minAmount,
    maxAmount,
    isMinMaxLoading
  };
};
