import { useFiatCurrenciesSelector } from 'app/store/buy-with-credit-card/selectors';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';

export const useInputLimits = (topUpProvider: TopUpProviderId, fiatCurrencyCode: string) => {
  const fiatCurrencies = useFiatCurrenciesSelector(topUpProvider);
  const fiatCurrency = fiatCurrencies.find(({ code }) => code === fiatCurrencyCode);

  return { minAmount: fiatCurrency?.minAmount, maxAmount: fiatCurrency?.maxAmount };
};
