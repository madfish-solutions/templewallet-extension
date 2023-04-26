import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';

import { useSelector } from '../index';

export const useFiatCurrenciesSelector = (topUpProvider: TopUpProviderId) =>
  useSelector(({ buyWithCreditCard }) => buyWithCreditCard.currencies[topUpProvider].data.fiat);

export const useCryptoCurrenciesSelector = (topUpProvider: TopUpProviderId) =>
  useSelector(({ buyWithCreditCard }) => buyWithCreditCard.currencies[topUpProvider].data.crypto);

export const useErrorSelector = (topUpProvider: TopUpProviderId) =>
  useSelector(({ buyWithCreditCard }) => buyWithCreditCard.currencies[topUpProvider].error);

export const useCurrenciesErrorsSelector = () => {
  const moonPayError = useErrorSelector(TopUpProviderId.MoonPay);
  const utorgError = useErrorSelector(TopUpProviderId.Utorg);
  const aliceBobError = useErrorSelector(TopUpProviderId.AliceBob);

  return {
    [TopUpProviderId.MoonPay]: moonPayError,
    [TopUpProviderId.Utorg]: utorgError,
    [TopUpProviderId.AliceBob]: aliceBobError
  };
};
