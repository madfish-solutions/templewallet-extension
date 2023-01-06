import { useCallback, useEffect, useState } from 'react';

import { CurrencyFiat } from 'app/templates/TopUpInput/types';
import { getAvailableFiatCurrencies, getMinMaxExchangeValue } from 'lib/apis/utorg';

import { buildIconSrc } from '../utils';

export const useUpdatedExchangeInfo = (currency: string, setIsApiError: (v: boolean) => void) => {
  const [isMinMaxLoading, setIsMinMaxLoading] = useState(false);
  const [isLoading, setLoading] = useState(false);

  const [currencies, setCurrencies] = useState<CurrencyFiat[]>([]);
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
      .then(codes => {
        setCurrencies(codes.map(code => ({ code, icon: buildIconSrc(code) })));
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
    isCurrenciesLoading: isLoading,
    currencies,
    minAmount,
    maxAmount,
    isMinMaxLoading
  };
};
