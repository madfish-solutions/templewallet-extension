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
    errors: mtPelerinErrors,
    provider: mtPelerinProvider,
    updateOutputAmount: updateMtPelerinOutputAmount,
    outputAmountLoading: mtPelerinOutputLoading
  } = usePaymentProvider(TopUpProviderId.MtPelerin, inputAmount, inputAsset, outputAsset);

  const allPaymentProviders = useMemo(() => [moonPayProvider, mtPelerinProvider], [moonPayProvider, mtPelerinProvider]);

  const providersErrors = useMemo(
    () => ({
      [TopUpProviderId.MoonPay]: moonPayErrors,
      [TopUpProviderId.MtPelerin]: mtPelerinErrors
    }),
    [moonPayErrors, mtPelerinErrors]
  );

  const paymentProvidersToDisplay = useMemo(
    () =>
      getPaymentProvidersToDisplay(
        allPaymentProviders,
        providersErrors,
        {
          [TopUpProviderId.MoonPay]: moonPayOutputLoading,
          [TopUpProviderId.MtPelerin]: mtPelerinOutputLoading
        },
        inputAmount
      ),
    [allPaymentProviders, providersErrors, inputAmount, moonPayOutputLoading, mtPelerinOutputLoading]
  );

  const updateOutputAmounts = useCallback(
    async (newInputAmount?: number, newInputAsset = inputAsset, newOutputAsset = outputAsset) => {
      const [moonPayOutputAmount, mtPelerinOutputAmount] = await Promise.all([
        updateMoonPayOutputAmount(newInputAmount, newInputAsset, newOutputAsset),
        updateMtPelerinOutputAmount(newInputAmount, newInputAsset, newOutputAsset)
      ]);

      return {
        [TopUpProviderId.MoonPay]: moonPayOutputAmount,
        [TopUpProviderId.MtPelerin]: mtPelerinOutputAmount
      };
    },
    [inputAsset, outputAsset, updateMoonPayOutputAmount, updateMtPelerinOutputAmount]
  );

  return {
    allPaymentProviders,
    paymentProvidersToDisplay,
    providersErrors,
    updateOutputAmounts
  };
};
