import { useCallback, useMemo, useRef } from 'react';

import BigNumber from 'bignumber.js';
import debounce from 'debounce-promise';
import isEqual from 'lodash.isequal';
import { useDispatch } from 'react-redux';

import { loadAllCurrenciesActions, updatePairLimitsActions } from 'app/store/buy-with-credit-card/actions';
import { getPaymentProvidersToDisplay } from 'lib/buy-with-credit-card/get-payment-providers-to-display';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import {
  PaymentProviderInterface,
  TopUpInputInterface,
  TopUpOutputInterface
} from 'lib/buy-with-credit-card/topup.interface';
import { isDefined } from 'lib/utils/is-defined';

import { useBuyWithCreditCardForm } from './use-buy-with-credit-card-form';
import { usePaymentProviders } from './use-payment-providers';

export const useFormInputsCallbacks = (
  form: ReturnType<typeof useBuyWithCreditCardForm>,
  paymentProviders: ReturnType<typeof usePaymentProviders>,
  isLoading: boolean,
  setIsLoading: (newValue: boolean) => void
) => {
  const { formValues, lazySetValue, triggerValidation } = form;
  const { allPaymentProviders, updateOutputAmounts } = paymentProviders;
  const { inputAmount, inputCurrency, outputToken, topUpProvider } = formValues;
  const outputCalculationDataRef = useRef({ inputAmount, inputCurrency, outputToken });
  const manuallySelectedProviderIdRef = useRef<TopUpProviderId>();
  const dispatch = useDispatch();

  const switchPaymentProvider = useCallback(
    (newProvider?: PaymentProviderInterface) => {
      const newOutputAmount = newProvider?.outputAmount;
      lazySetValue({ topUpProvider: newProvider, outputAmount: newOutputAmount });
      triggerValidation();
    },
    [lazySetValue, allPaymentProviders, triggerValidation]
  );

  const updateOutput = useMemo(
    () =>
      debounce(
        async (
          newInputAmount: number | undefined,
          newInputAsset: TopUpInputInterface,
          newOutputAsset: TopUpOutputInterface,
          shouldSwitchBetweenProviders: boolean
        ) => {
          const outputCalculationData = {
            inputAmount: newInputAmount,
            inputCurrency: newInputAsset,
            outputToken: newOutputAsset
          };
          const correctedNewInputAmount = isDefined(newInputAmount)
            ? new BigNumber(newInputAmount).decimalPlaces(newInputAsset.precision).toNumber()
            : undefined;
          lazySetValue({
            inputAmount: correctedNewInputAmount,
            inputCurrency: newInputAsset,
            outputToken: newOutputAsset
          });
          const amounts = await updateOutputAmounts(correctedNewInputAmount, newInputAsset, newOutputAsset);

          if (!isEqual(outputCalculationData, outputCalculationDataRef.current)) {
            return;
          }

          const patchedPaymentProviders = getPaymentProvidersToDisplay(
            allPaymentProviders.map(({ id, ...rest }) => ({
              ...rest,
              id,
              inputSymbol: newInputAsset.code,
              inputPrecision: newInputAsset.precision,
              minInputAmount: newInputAsset.minAmount,
              maxInputAmount: newInputAsset.maxAmount,
              outputAmount: amounts[id],
              outputSymbol: outputToken.code,
              outputPrecision: outputToken.precision
            })),
            {},
            {},
            correctedNewInputAmount
          );
          const autoselectedPaymentProvider = patchedPaymentProviders[0];

          if (shouldSwitchBetweenProviders && !isDefined(manuallySelectedProviderIdRef.current)) {
            switchPaymentProvider(autoselectedPaymentProvider);
          } else if (isDefined(correctedNewInputAmount)) {
            const patchedSameProvider = patchedPaymentProviders.find(({ id }) => id === topUpProvider?.id);
            const newPaymentProvider = patchedSameProvider ?? autoselectedPaymentProvider;
            void switchPaymentProvider(newPaymentProvider);
          }
          setIsLoading(false);
        },
        200
      ),
    [topUpProvider, updateOutputAmounts, allPaymentProviders, switchPaymentProvider, lazySetValue]
  );
  const handleInputValueChange = useCallback(
    (newInputAmount: number | undefined, newInputAsset: TopUpInputInterface) => {
      outputCalculationDataRef.current = { inputAmount: newInputAmount, inputCurrency: newInputAsset, outputToken };
      setIsLoading(true);
      void updateOutput(newInputAmount, newInputAsset, outputToken, true);
    },
    [updateOutput, outputToken]
  );
  const handleInputAssetChange = useCallback(
    (newValue: TopUpInputInterface) => handleInputValueChange(inputAmount, newValue),
    [handleInputValueChange, inputAmount]
  );
  const handleInputAmountChange = useCallback(
    (newValue?: number) => handleInputValueChange(newValue, inputCurrency),
    [handleInputValueChange, inputCurrency]
  );
  const handleOutputTokenChange = useCallback(
    (newValue: TopUpOutputInterface) => {
      outputCalculationDataRef.current = { inputAmount, inputCurrency, outputToken: newValue };
      setIsLoading(true);
      void updateOutput(inputAmount, inputCurrency, newValue, true);
    },
    [inputAmount, inputCurrency, updateOutput]
  );

  const handlePaymentProviderChange = useCallback(
    (newProvider?: PaymentProviderInterface) => {
      manuallySelectedProviderIdRef.current = newProvider?.id;
      void switchPaymentProvider(newProvider);
    },
    [switchPaymentProvider]
  );

  const refreshForm = useCallback(() => {
    dispatch(loadAllCurrenciesActions.submit());
    dispatch(updatePairLimitsActions.submit({ fiatSymbol: inputCurrency.code, cryptoSymbol: outputToken.code }));
    if (!isLoading) {
      outputCalculationDataRef.current = { inputAmount, inputCurrency, outputToken };
      setIsLoading(true);
      void updateOutput(inputAmount, inputCurrency, outputToken, false);
    }
  }, [dispatch, inputCurrency, outputToken, updateOutput, isLoading, inputAmount]);

  return {
    switchPaymentProvider,
    updateOutput,
    handleInputAssetChange,
    handleInputAmountChange,
    handleOutputTokenChange,
    handlePaymentProviderChange,
    refreshForm
  };
};
