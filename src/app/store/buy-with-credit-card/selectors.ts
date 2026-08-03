import { useMemo } from 'react';

import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';

import { useSelector } from '../index';

import { PairLimits } from './state';

export const useProviderCurrenciesErrorSelector = (topUpProvider: TopUpProviderId) =>
  useSelector(({ buyWithCreditCard }) => buyWithCreditCard.currencies[topUpProvider].error);

export const useFiatCurrenciesSelector = (topUpProvider: TopUpProviderId) =>
  useSelector(({ buyWithCreditCard }) => buyWithCreditCard.currencies[topUpProvider].data.fiat);

export const useCryptoCurrenciesSelector = (topUpProvider: TopUpProviderId) =>
  useSelector(({ buyWithCreditCard }) => buyWithCreditCard.currencies[topUpProvider].data.crypto);

const useCurrenciesByProviderLoadingSelector = (topUpProvider: TopUpProviderId) =>
  useSelector(({ buyWithCreditCard }) => buyWithCreditCard.currencies[topUpProvider].isLoading);

export const useCurrenciesLoadingSelector = () => {
  const moonPayLoading = useCurrenciesByProviderLoadingSelector(TopUpProviderId.MoonPay);
  const mtPelerinLoading = useCurrenciesByProviderLoadingSelector(TopUpProviderId.MtPelerin);

  return moonPayLoading || mtPelerinLoading;
};

const useCurrenciesErrorSelector = (topUpProvider: TopUpProviderId) =>
  useSelector(({ buyWithCreditCard }) => buyWithCreditCard.currencies[topUpProvider].error);

export const useCurrenciesErrorsSelector = () => {
  const moonPayError = useCurrenciesErrorSelector(TopUpProviderId.MoonPay);
  const mtPelerinError = useCurrenciesErrorSelector(TopUpProviderId.MtPelerin);

  return useMemo(
    () => ({
      [TopUpProviderId.MoonPay]: moonPayError,
      [TopUpProviderId.MtPelerin]: mtPelerinError
    }),
    [moonPayError, mtPelerinError]
  );
};

export const useAllPairsLimitsSelector = () => useSelector(({ buyWithCreditCard }) => buyWithCreditCard.pairLimits);

export const usePairLimitsSelector = (fiatSymbol: string, cryptoSlug: string): PairLimits | undefined =>
  useSelector(({ buyWithCreditCard }) => buyWithCreditCard.pairLimits[fiatSymbol]?.[cryptoSlug]);

export const useProviderPairLimitsSelector = (
  fiatSymbol: string,
  cryptoSlug: string,
  topUpProvider: TopUpProviderId
): PairLimits[TopUpProviderId] | undefined =>
  useSelector(({ buyWithCreditCard }) => buyWithCreditCard.pairLimits[fiatSymbol]?.[cryptoSlug]?.[topUpProvider]);

const usePairLimitsErrorSelector = (fiatSymbol: string, cryptoSlug: string, topUpProvider: TopUpProviderId) =>
  useSelector(
    ({ buyWithCreditCard }) => buyWithCreditCard.pairLimits[fiatSymbol]?.[cryptoSlug]?.[topUpProvider]?.error
  );

export const usePairLimitsErrorsSelector = (fiatSymbol: string, cryptoSlug: string) => {
  const moonPayError = usePairLimitsErrorSelector(fiatSymbol, cryptoSlug, TopUpProviderId.MoonPay);
  const mtPelerinError = usePairLimitsErrorSelector(fiatSymbol, cryptoSlug, TopUpProviderId.MtPelerin);

  return useMemo(
    () => ({
      [TopUpProviderId.MoonPay]: moonPayError,
      [TopUpProviderId.MtPelerin]: mtPelerinError
    }),
    [moonPayError, mtPelerinError]
  );
};
