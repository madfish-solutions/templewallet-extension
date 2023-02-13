import { useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';
import axios from 'axios';
import { BigNumber } from 'bignumber.js';

import { useSelector } from 'app/store';
import { useStorage } from 'lib/temple/front';
import { isTruthy } from 'lib/utils';

import { FIAT_CURRENCIES } from './consts';
import type { FiatCurrencyOption, CoingeckoFiatInterface } from './types';

const FIAT_CURRENCY_STORAGE_KEY = 'fiat_currency';

export function useAssetUSDPrice(slug: string) {
  const usdToTokenRates = useSelector(state => state.currency.usdToTokenRates.data);

  return useMemo(() => {
    const rawValue = usdToTokenRates[slug];
    return rawValue ? Number(rawValue) : null;
  }, [slug, usdToTokenRates]);
}

export function useAssetFiatCurrencyPrice(slug: string): BigNumber {
  const {
    fiatRates,
    selectedFiatCurrency: { name: selectedFiatCurrencyName }
  } = useFiatCurrency();

  const usdToTokenRate = useAssetUSDPrice(slug);

  return useMemo(() => {
    if (!isDefined(fiatRates) || !isTruthy(usdToTokenRate)) return new BigNumber(0);

    const fiatRate = fiatRates[selectedFiatCurrencyName.toLowerCase()] ?? 1;
    const usdRate = fiatRates['usd'] ?? 1;
    const fiatToUsdRate = fiatRate / usdRate;

    return BigNumber(fiatToUsdRate).times(usdToTokenRate);
  }, [fiatRates, usdToTokenRate, selectedFiatCurrencyName]);
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
