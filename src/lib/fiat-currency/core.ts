import { useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';
import axios from 'axios';
import { BigNumber } from 'bignumber.js';

import { useSelector } from 'app/store/root-state.selector';
import { useStorage } from 'lib/temple/front';
import { isTruthy } from 'lib/utils';

import { FIAT_CURRENCIES } from './consts';
import type { FiatCurrencyOption, CoingeckoFiatInterface } from './types';

const FIAT_CURRENCY_STORAGE_KEY = 'fiat_currency';

export const useUsdToTokenRates = () => useSelector(state => state.currency.usdToTokenRates.data);

function useAssetUSDPrice(slug: string) {
  const usdToTokenRates = useUsdToTokenRates();

  return useMemo(() => {
    const rateStr = usdToTokenRates[slug];
    return rateStr ? Number(rateStr) : undefined;
  }, [slug, usdToTokenRates]);
}

export const useFiatToUsdRate = () => {
  const {
    fiatRates,
    selectedFiatCurrency: { name: selectedFiatCurrencyName }
  } = useFiatCurrency();

  return useMemo(() => {
    if (!isDefined(fiatRates)) return;

    const fiatRate = fiatRates[selectedFiatCurrencyName.toLowerCase()] ?? 1;
    const usdRate = fiatRates['usd'] ?? 1;

    return fiatRate / usdRate;
  }, [fiatRates, selectedFiatCurrencyName]);
};

export function useAssetFiatCurrencyPrice(slug: string): BigNumber {
  const fiatToUsdRate = useFiatToUsdRate();
  const usdToTokenRate = useAssetUSDPrice(slug);

  return useMemo(() => {
    if (!isTruthy(usdToTokenRate) || !isTruthy(fiatToUsdRate)) return new BigNumber(0);

    return BigNumber(fiatToUsdRate).times(usdToTokenRate);
  }, [fiatToUsdRate, usdToTokenRate]);
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
