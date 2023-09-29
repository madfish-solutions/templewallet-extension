import { useCallback, useEffect, useState } from 'react';

import { knownAliceBobFiatCurrencies, knownAliceBobFiatCurrenciesNames } from 'app/store/buy-with-credit-card/utils';
import { getAliceBobPairsInfo } from 'lib/apis/temple';
import { FIAT_ICONS_SRC } from 'lib/icons';

export interface AliceBobWithdrawCurrency {
  name: string;
  code: string;
  icon: string;
  minAmount?: number;
  maxAmount?: number;
}

export const DEFAULT_OUTPUT_CURRENCY = {
  name: knownAliceBobFiatCurrenciesNames['UAH'],
  code: 'UAH',
  icon: FIAT_ICONS_SRC.UAH
};

export const useOutputCurrencies = (
  setIsApiError: (v: boolean) => void,
  outputCurrency: AliceBobWithdrawCurrency,
  setOutputCurrency: (currency: AliceBobWithdrawCurrency) => void
) => {
  const [isCurrenciesLoading, setIsCurrenciesLoading] = useState(false);

  const [currencies, setCurrencies] = useState<AliceBobWithdrawCurrency[]>([]);

  const getCurrenciesRequest = useCallback(() => {
    setIsCurrenciesLoading(true);

    getAliceBobPairsInfo(true)
      .then(response => {
        const newCurrencies = response.data.pairsInfo.map(pair => {
          const code = pair.to.slice(-3);
          const minAmount = Number(pair.minamount.split(' ')[0]);
          const maxAmount = Number(pair.maxamount.split(' ')[0]);

          if (knownAliceBobFiatCurrencies[code]) {
            return {
              ...knownAliceBobFiatCurrencies[code],
              minAmount,
              maxAmount
            };
          }

          return {
            name: knownAliceBobFiatCurrenciesNames[code] ?? '',
            code,
            icon: '',
            minAmount,
            maxAmount
          };
        });

        setCurrencies(newCurrencies);

        if (!outputCurrency.minAmount) {
          setOutputCurrency(newCurrencies.find(currency => currency.code === 'UAH') ?? DEFAULT_OUTPUT_CURRENCY);
        }
      })
      .catch(() => setIsApiError(true))
      .finally(() => setIsCurrenciesLoading(false));
  }, [outputCurrency.minAmount, setIsApiError, setOutputCurrency]);

  useEffect(() => {
    getCurrenciesRequest();
  }, [getCurrenciesRequest]);

  return {
    isCurrenciesLoading,
    currencies
  };
};
