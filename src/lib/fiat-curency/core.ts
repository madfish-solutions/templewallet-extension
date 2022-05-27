import { useMemo } from 'react';

import constate from 'constate';

import makeBuildQueryFn from 'lib/makeBuildQueryFn';
import { useRetryableSWR } from 'lib/swr';
import { useAssetUSDPrice, useStorage } from 'lib/temple/front';

import { FIAT_CURRENCIES } from './consts';
import { CoingeckoQuoteInterface, ExchangeRateRecord, FiatCurrencyOption } from './types';

const buildQuery = makeBuildQueryFn<Record<string, unknown>, any>('https://api.coingecko.com/api/v3/');

const getFiatCurrencies = buildQuery<{}, CoingeckoQuoteInterface>(
  'GET',
  `/simple/price?ids=tezos&vs_currencies=${FIAT_CURRENCIES.map(({ apiLabel }) => apiLabel).join(',')}`
);

const FIAT_CURRENCY_STORAGE_KEY = 'fiat_currency';

export function useAssetFiatCurrencyPrice(slug: string) {
  const exchangeRate = useAssetUSDPrice(slug);
  const exchangeRateTezos = useAssetUSDPrice('tez');
  const { fiatRates, selectedFiatCurrency } = useFiatCurrency();

  return useMemo(() => {
    if (!fiatRates || !exchangeRate || !exchangeRateTezos) return null;
    const fiatToUsdRate = fiatRates[selectedFiatCurrency.name.toLowerCase()] / exchangeRateTezos;
    const trueExchangeRate = fiatToUsdRate * exchangeRate;
    return trueExchangeRate;
  }, [fiatRates, exchangeRate, exchangeRateTezos, selectedFiatCurrency.name]);
}

export const [FiatCurrencyProvider, useFiatCurrency] = constate((params: { suspense?: boolean }) => {
  const { data } = useRetryableSWR('fiat-currencies', fetchFiatCurrencies, {
    refreshInterval: 5 * 60 * 1_000,
    dedupingInterval: 30_000,
    suspense: params.suspense
  });
  const [selectedFiatCurrency, setSelectedFiatCurrency] = useStorage<FiatCurrencyOption>(
    FIAT_CURRENCY_STORAGE_KEY,
    FIAT_CURRENCIES[0]
  );
  return {
    selectedFiatCurrency,
    setSelectedFiatCurrency,
    fiatRates: data
  };
});

async function fetchFiatCurrencies() {
  const mappedRates: ExchangeRateRecord = {};

  try {
    const data = await getFiatCurrencies({});
    const tezosData = Object.keys(data.tezos);

    for (const quote of tezosData) {
      mappedRates[quote] = +data.tezos[quote];
    }
  } catch {}

  return mappedRates;
}

export const getFiatCurrencyKey = ({ name }: FiatCurrencyOption) => name;
