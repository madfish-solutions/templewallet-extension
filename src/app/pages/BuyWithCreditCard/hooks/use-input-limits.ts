import { useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';

import { usePairLimitsSelector, useFiatCurrenciesSelector } from 'app/store/buy-with-credit-card/selectors';
import { intersectLimits } from 'lib/buy-with-credit-card/intersect-limits';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';

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
      return {};
    }

    return intersectLimits([pairLimits?.data, { min: fiatCurrency?.minAmount, max: fiatCurrency?.maxAmount }]);
  }, [pairLimits, fiatCurrency]);
};
