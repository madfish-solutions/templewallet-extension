import { useCallback, useMemo } from 'react';

import { getPaymentProvidersToDisplay } from 'lib/buy-with-credit-card/get-payment-providers-to-display';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import { TopUpInputInterface, TopUpOutputInterface } from 'lib/buy-with-credit-card/topup.interface';

import { usePaymentProvider } from './use-one-payment-provider';

export const usePaymentProviders = (
  inputAmount: number | undefined,
  inputAsset: TopUpInputInterface,
  outputAsset: TopUpOutputInterface
) => {
  const {
    errors: moonPayErrors,
    provider: moonPayProvider,
    updateOutputAmount: updateMoonPayOutputAmount,
    outputAmountLoading: moonPayOutputLoading
  } = usePaymentProvider(TopUpProviderId.MoonPay, inputAmount, inputAsset, outputAsset);
  const {
    errors: utorgErrors,
    provider: utorgProvider,
    updateOutputAmount: updateUtorgOutputAmount,
    outputAmountLoading: utorgOutputLoading
  } = usePaymentProvider(TopUpProviderId.Utorg, inputAmount, inputAsset, outputAsset);

  const allPaymentProviders = useMemo(() => [moonPayProvider, utorgProvider], [moonPayProvider, utorgProvider]);

  const providersErrors = useMemo(
    () => ({
      [TopUpProviderId.MoonPay]: moonPayErrors,
      [TopUpProviderId.Utorg]: utorgErrors
    }),
    [moonPayErrors, utorgErrors]
  );

  const paymentProvidersToDisplay = useMemo(
    () =>
      getPaymentProvidersToDisplay(
        allPaymentProviders,
        providersErrors,
        {
          [TopUpProviderId.MoonPay]: moonPayOutputLoading,
          [TopUpProviderId.Utorg]: utorgOutputLoading
        },
        inputAmount
      ),
    [allPaymentProviders, providersErrors, inputAmount, moonPayOutputLoading, utorgOutputLoading]
  );

  const updateOutputAmounts = useCallback(
    async (newInputAmount?: number, newInputAsset = inputAsset, newOutputAsset = outputAsset) => {
      const [moonPayOutputAmount, utorgOutputAmount] = await Promise.all([
        updateMoonPayOutputAmount(newInputAmount, newInputAsset, newOutputAsset),
        updateUtorgOutputAmount(newInputAmount, newInputAsset, newOutputAsset)
      ]);

      return {
        [TopUpProviderId.MoonPay]: moonPayOutputAmount,
        [TopUpProviderId.Utorg]: utorgOutputAmount
      };
    },
    [inputAsset, outputAsset, updateMoonPayOutputAmount, updateUtorgOutputAmount]
  );

  return {
    allPaymentProviders,
    paymentProvidersToDisplay,
    providersErrors,
    updateOutputAmounts
  };
};
