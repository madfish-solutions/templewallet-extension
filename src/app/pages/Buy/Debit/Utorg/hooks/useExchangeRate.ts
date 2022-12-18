import { useEffect, useState } from 'react';

import { getExchangeRate } from 'lib/apis/utorg';

import { booleanSetter } from '../config';

export const useExchangeRate = (inputAmount = 0, inputCurrency: string, setLoading: booleanSetter) => {
  const [exchangeRate, setExchangeRate] = useState(0);

  useEffect(() => {
    setLoading(true);
    getExchangeRate(inputAmount, inputCurrency)
      .then((fetchedRate = 0) => {
        const rate = Number(fetchedRate.toPrecision(4)) || 0;
        setExchangeRate(rate);
      })
      .finally(() => setLoading(false));
  }, [inputAmount, inputCurrency, setLoading]);

  return exchangeRate;
};
