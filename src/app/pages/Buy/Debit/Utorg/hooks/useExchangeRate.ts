import { useEffect, useState } from 'react';

import { getExchangeRate } from 'lib/apis/utorg';

export const useExchangeRate = (inputAmount = 0, minAmount = 0, inputCurrency: string) => {
  const [exchangeRate, setExchangeRate] = useState(0);
  const [isLoading, setLoading] = useState(false);

  const amount = inputAmount < minAmount ? minAmount : inputAmount;

  useEffect(() => {
    setLoading(true);
    getExchangeRate(amount, inputCurrency)
      .then((fetchedRate = 0) => {
        const rate = Number(fetchedRate.toPrecision(4)) || 0;
        setExchangeRate(rate);
      })
      .finally(() => setLoading(false));
  }, [amount, inputCurrency, setLoading]);

  return { isRateLoading: isLoading, exchangeRate };
};
