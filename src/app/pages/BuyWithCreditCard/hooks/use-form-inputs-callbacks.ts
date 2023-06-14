import { useCallback, useMemo, useRef } from 'react';

import { isDefined } from '@rnw-community/shared';
import BigNumber from 'bignumber.js';
import debounce from 'debounce-promise';
import { useDispatch } from 'react-redux';

import { loadAllCurrenciesActions, updatePairLimitsActions } from 'app/store/buy-with-credit-card/actions';
import { useAllPairsLimitsSelector } from 'app/store/buy-with-credit-card/selectors';
import { mergeProvidersLimits } from 'lib/buy-with-credit-card/merge-limits';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import {
  PaymentProviderInterface,
  TopUpInputInterface,
  TopUpOutputInterface
} from 'lib/buy-with-credit-card/topup.interface';

import { useBuyWithCreditCardForm } from './use-buy-with-credit-card-form';
import { usePaymentProviders } from './use-payment-providers';

export const useFormInputsCallbacks = (
  form: ReturnType<typeof useBuyWithCreditCardForm>,
  updateOutputAmounts: ReturnType<typeof usePaymentProviders>['updateOutputAmounts'],
  formIsLoading: boolean,
  setFormIsLoading: (newValue: boolean) => void
) => {
  const { formValues, lazySetValue, triggerValidation } = form;
  const { inputAmount, inputCurrency, outputToken } = formValues;
  const outputCalculationDataRef = useRef({ inputAmount, inputCurrency, outputToken });
  const manuallySelectedProviderIdRef = useRef<TopUpProviderId>();
  const dispatch = useDispatch();
  const allPairsLimits = useAllPairsLimitsSelector();

  const setPaymentProvider = useCallback(
    (newProvider?: PaymentProviderInterface) => {
      lazySetValue({ topUpProvider: newProvider, outputAmount: newProvider?.outputAmount });
      triggerValidation();
    },
    [lazySetValue, triggerValidation]
  );

  const updateOutput = useMemo(
    () =>
      debounce(
        async (
          newInputAmount: number | undefined,
          newInputAsset: TopUpInputInterface,
          newOutputAsset: TopUpOutputInterface
        ) => {
          const correctedNewInputAmount = isDefined(newInputAmount)
            ? new BigNumber(newInputAmount).decimalPlaces(newInputAsset.precision).toNumber()
            : undefined;

          lazySetValue({
            inputAmount: correctedNewInputAmount,
            inputCurrency: newInputAsset,
            outputToken: newOutputAsset
          });

          await updateOutputAmounts(correctedNewInputAmount, newInputAsset, newOutputAsset);

          setFormIsLoading(false);
        },
        200
      ),
    [updateOutputAmounts, lazySetValue]
  );

  const handleInputValueChange = useCallback(
    (newInputAmount: number | undefined, newInputAsset: TopUpInputInterface) => {
      outputCalculationDataRef.current = { inputAmount: newInputAmount, inputCurrency: newInputAsset, outputToken };
      setFormIsLoading(true);
      void updateOutput(newInputAmount, newInputAsset, outputToken);
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
      const pairLimits = allPairsLimits[inputCurrency.code]?.[newValue.code];
      const { min: minInputAmount, max: maxInputAmount } = mergeProvidersLimits(pairLimits);

      const patchedInputCurrency = {
        ...inputCurrency,
        minAmount: minInputAmount,
        maxAmount: maxInputAmount
      };

      outputCalculationDataRef.current = { inputAmount, inputCurrency: patchedInputCurrency, outputToken: newValue };
      setFormIsLoading(true);
      updateOutput(inputAmount, patchedInputCurrency, newValue);
    },
    [inputAmount, inputCurrency, updateOutput, allPairsLimits]
  );

  const handlePaymentProviderChange = useCallback(
    (newProvider?: PaymentProviderInterface) => {
      manuallySelectedProviderIdRef.current = newProvider?.id;
      setPaymentProvider(newProvider);
    },
    [setPaymentProvider]
  );

  const refreshForm = useCallback(() => {
    dispatch(loadAllCurrenciesActions.submit());
    dispatch(updatePairLimitsActions.submit({ fiatSymbol: inputCurrency.code, cryptoSymbol: outputToken.code }));
    if (!formIsLoading) {
      outputCalculationDataRef.current = { inputAmount, inputCurrency, outputToken };
      setFormIsLoading(true);
      updateOutput(inputAmount, inputCurrency, outputToken);
    }
  }, [dispatch, inputCurrency, outputToken, updateOutput, formIsLoading, inputAmount]);

  return {
    handleInputAssetChange,
    handleInputAmountChange,
    handleOutputTokenChange,
    handlePaymentProviderChange,
    setPaymentProvider,
    manuallySelectedProviderIdRef,
    refreshForm
  };
};
