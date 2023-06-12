import { useMemo } from 'react';

import { usePairLimitsSelector } from 'app/store/buy-with-credit-card/selectors';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import { TopUpProviderPairLimits } from 'lib/buy-with-credit-card/topup.interface';

export const useInputLimits = (
  topUpProvider: TopUpProviderId,
  fiatCurrencyCode: string,
  cryptoCurrencyCode: string
): Partial<TopUpProviderPairLimits> => {
  const pairLimits = usePairLimitsSelector(fiatCurrencyCode, cryptoCurrencyCode, topUpProvider);

  return useMemo(() => pairLimits?.data ?? {}, [pairLimits]);
};
