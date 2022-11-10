import { useMemo } from 'react';

import { BigNumber } from 'bignumber.js';
import constate from 'constate';

import makeBuildQueryFn from 'lib/makeBuildQueryFn';
import { useRetryableSWR } from 'lib/swr';
import { useAssetUSDPrice, useStorage } from 'lib/temple/front';

import { FIAT_CURRENCIES } from './consts';
import { CoingeckoFiatInterface, ExchangeRateRecord, FiatCurrencyOption } from './types';

const buildQuery = makeBuildQueryFn<Record<string, unknown>, any>('https://api.coingecko.com/api/v3/');

const getFiatCurrencies = buildQuery<{}, CoingeckoFiatInterface>(
  'GET',
  `/simple/price?ids=tezos&vs_currencies=${FIAT_CURRENCIES.map(({ apiLabel }) => apiLabel).join(',')}`
);

const FIAT_CURRENCY_STORAGE_KEY = 'fiat_currency';

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

export const [FiatCurrencyProvider, useFiatCurrency] = constate((params: { suspense?: boolean }) => {
  const { data } = useRetryableSWR('fiat-currencies', fetchFiatCurrencies, {
    refreshInterval: 5 * 60_000,
    errorRetryInterval: 1_100,
    dedupingInterval: 30_000,
    suspense: params.suspense
  });
  const [selectedFiatCurrency, setSelectedFiatCurrency] = useStorage<FiatCurrencyOption>(
    FIAT_CURRENCY_STORAGE_KEY,
    FIAT_CURRENCIES[0]!
  );

  return {
    selectedFiatCurrency,
    setSelectedFiatCurrency,
    fiatRates: data
  };
});

async function fetchFiatCurrencies() {
  const mappedRates: ExchangeRateRecord = {};

  const data = await getFiatCurrencies({});
  const tezosData = Object.keys(data.tezos);

  for (const fiatCurrency of tezosData) {
    mappedRates[fiatCurrency] = +data.tezos[fiatCurrency];
  }

  return mappedRates;
}

export const getFiatCurrencyKey = ({ name }: FiatCurrencyOption) => name;
