import { useMemo } from 'react';

import { useFiatCurrenciesSelector } from 'app/store/buy-with-credit-card/selectors';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import { TopUpInputInterface } from 'lib/buy-with-credit-card/topup.interface';
import { isDefined } from 'lib/utils/is-defined';

export const useAllFiatCurrencies = () => {
  const moonpayFiatCurrencies = useFiatCurrenciesSelector(TopUpProviderId.MoonPay);
  const utorgFiatCurrencies = useFiatCurrenciesSelector(TopUpProviderId.Utorg);
  const aliceBobFiatCurrencies = useFiatCurrenciesSelector(TopUpProviderId.AliceBob);

  return useMemo(
    () =>
      Object.values(
        [...moonpayFiatCurrencies, ...utorgFiatCurrencies, ...aliceBobFiatCurrencies].reduce<
          Record<string, TopUpInputInterface>
        >((acc, currency) => {
          if (isDefined(acc[currency.code])) {
            const newTopUpCurrency = { ...acc[currency.code] };
            if (isDefined(currency.minAmount)) {
              newTopUpCurrency.minAmount = Math.min(newTopUpCurrency.minAmount ?? Infinity, currency.minAmount);
            }
            if (isDefined(currency.maxAmount)) {
              newTopUpCurrency.maxAmount = Math.max(newTopUpCurrency.maxAmount ?? -Infinity, currency.maxAmount);
            }
            acc[currency.code] = newTopUpCurrency;
          } else {
            acc[currency.code] = currency;
          }

          return acc;
        }, {})
      ).sort(({ code: aCode }, { code: bCode }) => aCode.localeCompare(bCode)),
    [moonpayFiatCurrencies, utorgFiatCurrencies, aliceBobFiatCurrencies]
  );
};
