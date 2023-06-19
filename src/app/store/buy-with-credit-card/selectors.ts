import { useMemo } from 'react';

import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';

import { useSelector } from '../index';

export const useFiatCurrenciesSelector = (topUpProvider: TopUpProviderId) =>
  useSelector(({ buyWithCreditCard }) => buyWithCreditCard.currencies[topUpProvider].data.fiat);

export const useCryptoCurrenciesSelector = (topUpProvider: TopUpProviderId) =>
  useSelector(({ buyWithCreditCard }) => buyWithCreditCard.currencies[topUpProvider].data.crypto);

const useCurrenciesByProviderLoadingSelector = (topUpProvider: TopUpProviderId) =>
  useSelector(({ buyWithCreditCard }) => buyWithCreditCard.currencies[topUpProvider].isLoading);

export const useCurrenciesLoadingSelector = () => {
  const moonPayLoading = useCurrenciesByProviderLoadingSelector(TopUpProviderId.MoonPay);
  const utorgLoading = useCurrenciesByProviderLoadingSelector(TopUpProviderId.Utorg);
  const aliceBobLoading = useCurrenciesByProviderLoadingSelector(TopUpProviderId.AliceBob);

  return moonPayLoading || utorgLoading || aliceBobLoading;
};

const useCurrenciesErrorSelector = (topUpProvider: TopUpProviderId) =>
  useSelector(({ buyWithCreditCard }) => buyWithCreditCard.currencies[topUpProvider].error);

export const useCurrenciesErrorsSelector = () => {
  const moonPayError = useCurrenciesErrorSelector(TopUpProviderId.MoonPay);
  const utorgError = useCurrenciesErrorSelector(TopUpProviderId.Utorg);
  const aliceBobError = useCurrenciesErrorSelector(TopUpProviderId.AliceBob);

  return useMemo(
    () => ({
      [TopUpProviderId.MoonPay]: moonPayError,
      [TopUpProviderId.Utorg]: utorgError,
      [TopUpProviderId.AliceBob]: aliceBobError
    }),
    [moonPayError, utorgError, aliceBobError]
  );
};

export const useAllPairsLimitsSelector = () => useSelector(({ buyWithCreditCard }) => buyWithCreditCard.pairLimits);

const useAllProvidersPairLimitsSelector = (fiatSymbol: string, cryptoSymbol: string) =>
  useSelector(({ buyWithCreditCard }) => buyWithCreditCard.pairLimits[fiatSymbol]?.[cryptoSymbol]);

export const usePairLimitsSelector = (fiatSymbol: string, cryptoSymbol: string, topUpProvider: TopUpProviderId) =>
  useAllProvidersPairLimitsSelector(fiatSymbol, cryptoSymbol)?.[topUpProvider];

const usePairLimitsErrorSelector = (fiatSymbol: string, cryptoSymbol: string, topUpProvider: TopUpProviderId) =>
  usePairLimitsSelector(fiatSymbol, cryptoSymbol, topUpProvider)?.error;

export const usePairLimitsErrorsSelector = (fiatSymbol: string, cryptoSymbol: string) => {
  const moonPayError = usePairLimitsErrorSelector(fiatSymbol, cryptoSymbol, TopUpProviderId.MoonPay);
  const utorgError = usePairLimitsErrorSelector(fiatSymbol, cryptoSymbol, TopUpProviderId.Utorg);
  const aliceBobError = usePairLimitsErrorSelector(fiatSymbol, cryptoSymbol, TopUpProviderId.AliceBob);

  return useMemo(
    () => ({
      [TopUpProviderId.MoonPay]: moonPayError,
      [TopUpProviderId.Utorg]: utorgError,
      [TopUpProviderId.AliceBob]: aliceBobError
    }),
    [moonPayError, utorgError, aliceBobError]
  );
};
