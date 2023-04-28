import { useMemo } from 'react';

import { useFiatCurrenciesSelector, usePairLimitsSelector } from 'app/store/buy-with-credit-card/selectors';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import { TopUpInputInterface } from 'lib/buy-with-credit-card/topup.interface';
import { isDefined } from 'lib/utils/is-defined';

export const useAllFiatCurrencies = (inputCurrencySymbol: string, outputTokenSymbol: string) => {
  const moonpayFiatCurrencies = useFiatCurrenciesSelector(TopUpProviderId.MoonPay);
  const utorgFiatCurrencies = useFiatCurrenciesSelector(TopUpProviderId.Utorg);
  const aliceBobFiatCurrencies = useFiatCurrenciesSelector(TopUpProviderId.AliceBob);
  const moonPayPairLimits = usePairLimitsSelector(inputCurrencySymbol, outputTokenSymbol, TopUpProviderId.MoonPay);
  const utorgPairLimits = usePairLimitsSelector(inputCurrencySymbol, outputTokenSymbol, TopUpProviderId.Utorg);
  const aliceBobPairLimits = usePairLimitsSelector(inputCurrencySymbol, outputTokenSymbol, TopUpProviderId.AliceBob);

  const allNonUniqueFiatCurrencies = useMemo(
    () => [...moonpayFiatCurrencies, ...utorgFiatCurrencies, ...aliceBobFiatCurrencies],
    [moonpayFiatCurrencies, utorgFiatCurrencies, aliceBobFiatCurrencies]
  );

  const pairLimits = useMemo(
    () =>
      [moonPayPairLimits, utorgPairLimits, aliceBobPairLimits].reduce<{ minAmount?: number; maxAmount?: number }>(
        (result, limitsEntity) => {
          const limits = limitsEntity?.data;
          if (isDefined(limits?.min)) {
            result.minAmount = Math.min(result.minAmount ?? Infinity, limits!.min);
          }
          if (isDefined(limits?.max)) {
            result.maxAmount = Math.max(result.maxAmount ?? 0, limits!.max);
          }

          return result;
        },
        {}
      ),
    [moonPayPairLimits, utorgPairLimits, aliceBobPairLimits]
  );

  return useMemo(() => {
    const noPairLimitsFiatCurrencies = Object.values(
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
    ).sort(({ code: aCode }, { code: bCode }) => aCode.localeCompare(bCode));
    const inputCurrency = noPairLimitsFiatCurrencies.find(({ code }) => code === inputCurrencySymbol);
    if (isDefined(inputCurrency)) {
      inputCurrency.minAmount = isDefined(pairLimits.minAmount)
        ? Math.max(pairLimits.minAmount, inputCurrency.minAmount ?? 0)
        : inputCurrency.minAmount;
      inputCurrency.maxAmount = isDefined(pairLimits.maxAmount)
        ? Math.min(pairLimits.maxAmount, inputCurrency.maxAmount ?? Infinity)
        : inputCurrency.maxAmount;
    }

    return noPairLimitsFiatCurrencies;
  }, [allNonUniqueFiatCurrencies, pairLimits, inputCurrencySymbol]);
};
