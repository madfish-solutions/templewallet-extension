import { useCallback, useEffect, useState } from 'react';

import { getAvailableFiatCurrencies, getMinMaxExchangeValue } from '../../../../../../lib/utorg-api';
import { booleanSetter } from '../config';

export const useUpdatedExchangeInfo = (setLoading: booleanSetter, setIsApiError: booleanSetter) => {
  const [isMinMaxLoading, setIsMinMaxLoading] = useState(false);

  const [currencies, setCurrencies] = useState<string[]>([]);
  const [minXtzExchangeAmount, setMinXtzExchangeAmount] = useState(15);
  const [maxXtzExchangeAmount, setMaxXtzExchangeAmount] = useState(5000);

  const updateMinMaxRequest = useCallback(() => {
    setIsMinMaxLoading(true);
    getMinMaxExchangeValue()
      .then(({ minAmount, maxAmount }) => {
        setMinXtzExchangeAmount(minAmount);
        setMaxXtzExchangeAmount(maxAmount);
        setIsMinMaxLoading(false);
      })
      .catch(() => {
        setIsApiError(true);
        setIsMinMaxLoading(false);
      });
  }, [setIsApiError, setIsMinMaxLoading]);

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
    minXtzExchangeAmount,
    maxXtzExchangeAmount,
    isMinMaxLoading
  };
};
