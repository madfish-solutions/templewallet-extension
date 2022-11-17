import { useMemo } from 'react';

import axios from 'axios';
import { BigNumber } from 'bignumber.js';

import { useSelector } from 'app/store';
import { useStorage } from 'lib/temple/front';

import { FIAT_CURRENCIES } from './consts';
import type { FiatCurrencyOption, CoingeckoFiatInterface } from './types';

const FIAT_CURRENCY_STORAGE_KEY = 'fiat_currency';

function useAssetUSDPrice(slug: string) {
  const prices = useSelector(state => state.currency.usdToTokenRates.data);

  return useMemo(() => {
    const rawValue = prices[slug];
    return rawValue ? Number(rawValue) : null;
  }, [slug, prices]);
}

export function useAssetFiatCurrencyPrice(slug: string): BigNumber {
  const exchangeRate = useAssetUSDPrice(slug);
  const exchangeRateTezos = useAssetUSDPrice('tez');
  const { fiatRates, selectedFiatCurrency } = useFiatCurrency();

  return useMemo(() => {
    if (!fiatRates || !exchangeRate || !exchangeRateTezos) return new BigNumber(0);
    const fiatToUsdRate = new BigNumber(fiatRates[selectedFiatCurrency.name.toLowerCase()]).div(exchangeRateTezos);
    const trueExchangeRate = fiatToUsdRate.times(exchangeRate);
    return trueExchangeRate;
  }, [fiatRates, exchangeRate, exchangeRateTezos, selectedFiatCurrency.name]);
}

export const useFiatCurrency = () => {
  const { data } = useSelector(state => state.currency.fiatToTezosRates);

  const [selectedFiatCurrency, setSelectedFiatCurrency] = useStorage<FiatCurrencyOption>(
    FIAT_CURRENCY_STORAGE_KEY,
    FIAT_CURRENCIES[0]!
  );

  return {
    selectedFiatCurrency,
    setSelectedFiatCurrency,
    fiatRates: data
  };
};

const coingeckoApi = axios.create({ baseURL: 'https://api.coingecko.com/api/v3/' });

export const fetchFiatToTezosRates = () =>
  coingeckoApi
    .get<CoingeckoFiatInterface>(
      `/simple/price?ids=tezos&vs_currencies=${FIAT_CURRENCIES.map(({ apiLabel }) => apiLabel).join(',')}`
    )
    .then(({ data }) => {
      const mappedRates: Record<string, number> = {};
      const tezosData = Object.keys(data.tezos);

      for (const quote of tezosData) {
        mappedRates[quote] = data.tezos[quote];
      }

      return mappedRates;
    });

export const getFiatCurrencyKey = ({ name }: FiatCurrencyOption) => name;
