import { useMemo } from 'react';

import { usePairLimitsSelector, useFiatCurrenciesSelector } from 'app/store/buy-with-credit-card/selectors';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import { isDefined } from 'lib/utils/is-defined';

export const useInputLimits = (
  topUpProvider: TopUpProviderId,
  fiatCurrencyCode: string,
  cryptoCurrencyCode: string
) => {
  const fiatCurrencies = useFiatCurrenciesSelector(topUpProvider);
  const fiatCurrency = fiatCurrencies.find(({ code }) => code === fiatCurrencyCode);
  const pairLimits = usePairLimitsSelector(fiatCurrencyCode, cryptoCurrencyCode, topUpProvider);

  return useMemo(() => {
    if (isDefined(pairLimits) && !isDefined(pairLimits.data) && isDefined(pairLimits.error)) {
      return { minAmount: undefined, maxAmount: undefined };
    }

    const limitsCandidates = [pairLimits?.data, { min: fiatCurrency?.minAmount, max: fiatCurrency?.maxAmount }];

    return limitsCandidates.reduce<{ minAmount?: number; maxAmount?: number }>(
      (result, limits) => {
        if (isDefined(limits?.min)) {
          result.minAmount = Math.max(result.minAmount ?? 0, limits!.min);
        }
        if (isDefined(limits?.max)) {
          result.maxAmount = Math.min(result.maxAmount ?? Infinity, limits!.max);
        }

        return result;
      },
      { minAmount: undefined, maxAmount: undefined }
    );
  }, [pairLimits, fiatCurrency]);
};
