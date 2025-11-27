import { useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';
import { union } from 'lodash';

import { useCryptoCurrenciesSelector } from 'app/store/buy-with-credit-card/selectors';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import { TopUpOutputInterface } from 'lib/buy-with-credit-card/topup.interface';

export const useAllCryptoCurrencies = () => {
  const moonpayCryptoCurrencies = useCryptoCurrenciesSelector(TopUpProviderId.MoonPay);
  const utorgCryptoCurrencies = useCryptoCurrenciesSelector(TopUpProviderId.Utorg);

  return useMemo(
    () =>
      Object.values(
        [...moonpayCryptoCurrencies, ...utorgCryptoCurrencies].reduce<Record<string, TopUpOutputInterface>>(
          (acc, token) => {
            const accToken = acc[token.slug];

            if (isDefined(accToken)) {
              acc[token.slug] = {
                ...accToken,
                providers: union(accToken.providers, token.providers)
              };
            } else {
              acc[token.slug] = token;
            }

            return acc;
          },
          {}
        )
      ).sort(({ code: aCode }, { code: bCode }) => aCode.localeCompare(bCode)),
    [moonpayCryptoCurrencies, utorgCryptoCurrencies]
  );
};
