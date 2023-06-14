import { useCallback, useMemo, useRef } from 'react';

import { isDefined } from '@rnw-community/shared';
import BigNumber from 'bignumber.js';
import debounce from 'debounce-promise';
import { isEqual } from 'lodash';
import { useDispatch } from 'react-redux';

import { loadAllCurrenciesActions, updatePairLimitsActions } from 'app/store/buy-with-credit-card/actions';
import { useAllPairsLimitsSelector } from 'app/store/buy-with-credit-card/selectors';
import { getAssetSymbolToDisplay } from 'lib/buy-with-credit-card/get-asset-symbol-to-display';
import { getPaymentProvidersToDisplay } from 'lib/buy-with-credit-card/get-payment-providers-to-display';
import { mergeProvidersLimits } from 'lib/buy-with-credit-card/merge-limits';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import {
  PaymentProviderInterface,
  TopUpInputInterface,
  TopUpOutputInterface
} from 'lib/buy-with-credit-card/topup.interface';

import { useAllFiatCurrencies } from './use-all-fiat-currencies';
import { useBuyWithCreditCardForm } from './use-buy-with-credit-card-form';
import { usePaymentProviders } from './use-payment-providers';

export const useFormInputsCallbacks = (
  form: ReturnType<typeof useBuyWithCreditCardForm>,
  paymentProviders: ReturnType<typeof usePaymentProviders>,
  formIsLoading: boolean,
  setFormIsLoading: (newValue: boolean) => void
) => {
  const { formValues, lazySetValue, triggerValidation } = form;
  const { allPaymentProviders, updateOutputAmounts } = paymentProviders;
  const { inputAmount, inputCurrency, outputToken, topUpProvider } = formValues;
  const outputCalculationDataRef = useRef({ inputAmount, inputCurrency, outputToken });
  const manuallySelectedProviderIdRef = useRef<TopUpProviderId>();
  const dispatch = useDispatch();
  const { noPairLimitsFiatCurrencies } = useAllFiatCurrencies(inputCurrency.code, outputToken.code);
  const allPairsLimits = useAllPairsLimitsSelector();

  const switchPaymentProvider = useCallback(
    (newProvider?: PaymentProviderInterface) => {
      lazySetValue({ topUpProvider: newProvider, outputAmount: newProvider?.outputAmount });
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
          newOutputAsset: TopUpOutputInterface
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
            setFormIsLoading(false);
            return;
          }

          const patchedPaymentProviders = getPaymentProvidersToDisplay(
            allPaymentProviders.map(({ id, ...rest }) => ({
              ...rest,
              id,
              inputSymbol: getAssetSymbolToDisplay(newInputAsset),
              inputPrecision: newInputAsset.precision,
              minInputAmount: newInputAsset.minAmount,
              maxInputAmount: newInputAsset.maxAmount,
              outputAmount: amounts[id],
              outputSymbol: getAssetSymbolToDisplay(newOutputAsset),
              outputPrecision: newOutputAsset.precision
            })),
            {},
            {},
            correctedNewInputAmount
          );

          const pairLimits = allPairsLimits[newInputAsset.code]?.[newOutputAsset.code];
          const patchedPossibleProviders = patchedPaymentProviders.filter(({ id }) =>
            isDefined(pairLimits?.[id]?.data)
          );

          const autoselectedProvider = patchedPossibleProviders[0];
          const patchedSamePossibleProvider = patchedPossibleProviders.find(({ id }) => id === topUpProvider?.id);
          const patchedSameProvider = patchedPaymentProviders.find(({ id }) => id === topUpProvider?.id);
          const newPaymentProvider = patchedSamePossibleProvider ?? autoselectedProvider ?? patchedSameProvider;

          if (!isEqual(newPaymentProvider, topUpProvider)) switchPaymentProvider(newPaymentProvider);

          setFormIsLoading(false);
        },
        200
      ),
    [topUpProvider, updateOutputAmounts, allPaymentProviders, switchPaymentProvider, allPairsLimits, lazySetValue]
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
    [inputAmount, inputCurrency, updateOutput, noPairLimitsFiatCurrencies, allPairsLimits]
  );

  const handlePaymentProviderChange = useCallback(
    (newProvider?: PaymentProviderInterface) => {
      manuallySelectedProviderIdRef.current = newProvider?.id;
      switchPaymentProvider(newProvider);
    },
    [switchPaymentProvider]
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
    switchPaymentProvider,
    handleInputAssetChange,
    handleInputAmountChange,
    handleOutputTokenChange,
    handlePaymentProviderChange,
    refreshForm
  };
};
