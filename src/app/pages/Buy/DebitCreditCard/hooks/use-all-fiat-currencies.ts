import { useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';
import { union } from 'lodash';

import { useAllPairsLimitsSelector, useFiatCurrenciesSelector } from 'app/store/buy-with-credit-card/selectors';
import { mergeProvidersLimits } from 'lib/buy-with-credit-card/merge-limits';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import { TopUpInputInterface } from 'lib/buy-with-credit-card/topup.interface';

export const useAllFiatCurrencies = (inputCurrencySymbol: string, outputTokenSlug: string) => {
  const moonpayFiatCurrencies = useFiatCurrenciesSelector(TopUpProviderId.MoonPay);
  const utorgFiatCurrencies = useFiatCurrenciesSelector(TopUpProviderId.Utorg);

  const allPairsLimits = useAllPairsLimitsSelector();

  const allNonUniqueFiatCurrencies = useMemo(
    () => [...moonpayFiatCurrencies, ...utorgFiatCurrencies],
    [moonpayFiatCurrencies, utorgFiatCurrencies]
  );

  const pairLimits = useMemo(
    () => mergeProvidersLimits(allPairsLimits[inputCurrencySymbol]?.[outputTokenSlug]),
    [allPairsLimits, inputCurrencySymbol, outputTokenSlug]
  );

  const noPairLimitsUniqueFiatCurrencies = useMemo(
    () =>
      Object.values(
        allNonUniqueFiatCurrencies.reduce<Record<string, TopUpInputInterface>>((acc, currency) => {
          const accCurrency = acc[currency.code];

          if (isDefined(accCurrency)) {
            const newTopUpCurrency = { ...accCurrency };

            if (isDefined(currency.minAmount)) {
              newTopUpCurrency.minAmount = Math.min(newTopUpCurrency.minAmount ?? Infinity, currency.minAmount);
            }
            if (isDefined(currency.maxAmount)) {
              newTopUpCurrency.maxAmount = Math.max(newTopUpCurrency.maxAmount ?? 0, currency.maxAmount);
            }

            acc[currency.code] = {
              ...newTopUpCurrency,
              providers: union(accCurrency.providers, currency.providers)
            };
          } else {
            acc[currency.code] = currency;
          }

          return acc;
        }, {})
      ).sort(({ code: aCode }, { code: bCode }) => aCode.localeCompare(bCode)),
    [allNonUniqueFiatCurrencies, inputCurrencySymbol]
  );

  const fiatCurrenciesWithPairLimits = useMemo(() => {
    const inputCurrencyIndex = noPairLimitsUniqueFiatCurrencies.findIndex(({ code }) => code === inputCurrencySymbol);
    if (inputCurrencyIndex === -1) return noPairLimitsUniqueFiatCurrencies;

    const fiatCurrenciesWithPairLimits = [...noPairLimitsUniqueFiatCurrencies];
    const inputCurrency = fiatCurrenciesWithPairLimits[inputCurrencyIndex]!;

    const { min: minAmount, max: maxAmount } = pairLimits;
    fiatCurrenciesWithPairLimits[inputCurrencyIndex] = {
      ...inputCurrency,
      minAmount,
      maxAmount
    };

    return fiatCurrenciesWithPairLimits;
  }, [noPairLimitsUniqueFiatCurrencies, pairLimits, inputCurrencySymbol]);

  return fiatCurrenciesWithPairLimits;
};
