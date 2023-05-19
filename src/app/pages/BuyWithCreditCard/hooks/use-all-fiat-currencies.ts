import { useMemo } from 'react';

import { useFiatCurrenciesSelector, usePairLimitsSelector } from 'app/store/buy-with-credit-card/selectors';
import { intersectLimits } from 'lib/buy-with-credit-card/intersect-limits';
import { mergeLimits } from 'lib/buy-with-credit-card/merge-limits';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import { TopUpInputInterface } from 'lib/buy-with-credit-card/topup.interface';
import { isDefined } from 'lib/utils/is-defined';

export const useAllFiatCurrencies = (inputCurrencySymbol: string, outputTokenSymbol: string) => {
  const moonpayFiatCurrencies = useFiatCurrenciesSelector(TopUpProviderId.MoonPay);
  const utorgFiatCurrencies = useFiatCurrenciesSelector(TopUpProviderId.Utorg);
  const aliceBobFiatCurrencies = useFiatCurrenciesSelector(TopUpProviderId.AliceBob);
  const binanceConnectFiatCurrencies = useFiatCurrenciesSelector(TopUpProviderId.BinanceConnect);

  const moonPayPairLimits = usePairLimitsSelector(inputCurrencySymbol, outputTokenSymbol, TopUpProviderId.MoonPay);
  const utorgPairLimits = usePairLimitsSelector(inputCurrencySymbol, outputTokenSymbol, TopUpProviderId.Utorg);
  const aliceBobPairLimits = usePairLimitsSelector(inputCurrencySymbol, outputTokenSymbol, TopUpProviderId.AliceBob);
  const binanceConnectPairLimits = usePairLimitsSelector(
    inputCurrencySymbol,
    outputTokenSymbol,
    TopUpProviderId.BinanceConnect
  );

  const allNonUniqueFiatCurrencies = useMemo(
    () => [
      ...moonpayFiatCurrencies,
      ...utorgFiatCurrencies,
      ...aliceBobFiatCurrencies,
      ...binanceConnectFiatCurrencies
    ],
    [moonpayFiatCurrencies, utorgFiatCurrencies, aliceBobFiatCurrencies, binanceConnectFiatCurrencies]
  );

  const pairLimits = useMemo(
    () =>
      mergeLimits(
        [moonPayPairLimits, utorgPairLimits, aliceBobPairLimits, binanceConnectPairLimits]
          .filter(isDefined)
          .map(({ data }) => data)
          .filter(isDefined)
      ),
    [moonPayPairLimits, utorgPairLimits, aliceBobPairLimits, binanceConnectPairLimits]
  );

  const noPairLimitsFiatCurrencies = useMemo(
    () =>
      Object.values(
        allNonUniqueFiatCurrencies.reduce<Record<string, TopUpInputInterface>>((acc, currency) => {
          if (isDefined(acc[currency.code])) {
            const newTopUpCurrency = { ...acc[currency.code] };
            if (isDefined(currency.minAmount)) {
              newTopUpCurrency.minAmount = Math.min(newTopUpCurrency.minAmount ?? Infinity, currency.minAmount);
            }
            if (isDefined(currency.maxAmount)) {
              newTopUpCurrency.maxAmount = Math.max(newTopUpCurrency.maxAmount ?? 0, currency.maxAmount);
            }
            acc[currency.code] = newTopUpCurrency;
          } else {
            acc[currency.code] = { ...currency };
          }

          return acc;
        }, {})
      ).sort(({ code: aCode }, { code: bCode }) => aCode.localeCompare(bCode)),
    [allNonUniqueFiatCurrencies, inputCurrencySymbol]
  );

  const fiatCurrenciesWithPairLimits = useMemo(() => {
    const fiatCurrenciesWithPairLimits = [...noPairLimitsFiatCurrencies];
    const inputCurrencyIndex = fiatCurrenciesWithPairLimits.findIndex(({ code }) => code === inputCurrencySymbol);
    if (inputCurrencyIndex !== -1) {
      const inputCurrency = fiatCurrenciesWithPairLimits[inputCurrencyIndex];
      const { min: minAmount, max: maxAmount } = intersectLimits([
        { min: inputCurrency.minAmount, max: inputCurrency.maxAmount },
        pairLimits
      ]);
      fiatCurrenciesWithPairLimits[inputCurrencyIndex] = {
        ...inputCurrency,
        minAmount,
        maxAmount
      };
    }

    return fiatCurrenciesWithPairLimits;
  }, [noPairLimitsFiatCurrencies, pairLimits, inputCurrencySymbol]);

  return {
    noPairLimitsFiatCurrencies,
    fiatCurrenciesWithPairLimits
  };
};
