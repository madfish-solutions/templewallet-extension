import { useCallback, useMemo, useRef } from 'react';

import { isDefined } from '@rnw-community/shared';
import BigNumber from 'bignumber.js';
import debounce from 'debounce-promise';
import { intersection } from 'lodash';
import type { UseFormReturn } from 'react-hook-form-v7';

import { dispatch } from 'app/store';
import { updatePairLimitsActions } from 'app/store/buy-with-credit-card/actions';
import { useAllPairsLimitsSelector } from 'app/store/buy-with-credit-card/selectors';
import { mergeProvidersLimits } from 'lib/buy-with-credit-card/merge-limits';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import {
  PaymentProviderInterface,
  TopUpInputInterface,
  TopUpOutputInterface
} from 'lib/buy-with-credit-card/topup.interface';
import { useAccountAddressForTezos } from 'temple/front';

import { DEFAULT_EVM_OUTPUT_TOKEN, DEFAULT_TEZOS_OUTPUT_TOKEN } from '../config';
import { BuyWithCreditCardFormData } from '../form-data.interface';

import { usePaymentProviders } from './use-payment-providers';

export const useFormInputsCallbacks = (
  form: UseFormReturn<BuyWithCreditCardFormData>,
  updateProvidersOutputs: ReturnType<typeof usePaymentProviders>['updateOutputAmounts'],
  formIsLoading: boolean,
  setFormIsLoading: SyncFn<boolean>
) => {
  const { watch, setValue, trigger } = form;

  const tezosAddress = useAccountAddressForTezos();

  const inputAmount = watch('inputAmount');
  const inputCurrency = watch('inputCurrency');
  const outputToken = watch('outputToken');
  const topUpProvider = watch('provider');

  const outputCalculationDataRef = useRef({ inputAmount, inputCurrency, outputToken });
  const manuallySelectedProviderIdRef = useRef<TopUpProviderId>();
  const allPairsLimits = useAllPairsLimitsSelector();

  const setPaymentProvider = useCallback(
    (newProvider?: PaymentProviderInterface) => {
      setValue('provider', newProvider);
      setValue('outputAmount', newProvider?.outputAmount);
    },
    [setValue]
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

          setValue('inputAmount', correctedNewInputAmount);
          setValue('inputCurrency', newInputAsset);
          setValue('outputToken', newOutputAsset);

          // Discarding current provider's output instead of provider itself (i.e. `setPaymentProvider(undefined)`)
          // Thus purchase link loading is delayed till provider is updated
          if (isDefined(topUpProvider)) setPaymentProvider({ ...topUpProvider, outputAmount: undefined });

          await updateProvidersOutputs(correctedNewInputAmount, newInputAsset, newOutputAsset);

          trigger('inputAmount');

          setFormIsLoading(false);
        },
        200
      ),
    [setValue, topUpProvider, setPaymentProvider, updateProvidersOutputs, trigger, setFormIsLoading]
  );

  const handleInputValueChange = useCallback(
    (newInputAmount: number | undefined, newInputAsset: TopUpInputInterface) => {
      let newOutputAsset = outputToken;

      if (intersection(newInputAsset.providers, outputToken.providers).length === 0) {
        newOutputAsset = tezosAddress ? DEFAULT_TEZOS_OUTPUT_TOKEN : DEFAULT_EVM_OUTPUT_TOKEN;
      }

      outputCalculationDataRef.current = {
        inputAmount: newInputAmount,
        inputCurrency: newInputAsset,
        outputToken: newOutputAsset
      };
      setFormIsLoading(true);
      void updateOutput(newInputAmount, newInputAsset, newOutputAsset);
    },
    [outputToken, setFormIsLoading, tezosAddress, updateOutput]
  );

  const handleInputAssetChange = useCallback(
    (newValue: TopUpInputInterface) => handleInputValueChange(inputAmount, newValue),
    [handleInputValueChange, inputAmount]
  );

  const handleInputAmountChange = useCallback(
    (newValue?: number) => {
      setValue('inputAmount', newValue, { shouldValidate: true });
      handleInputValueChange(newValue, inputCurrency);
    },
    [handleInputValueChange, inputCurrency, setValue]
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
    [allPairsLimits, inputCurrency, inputAmount, setFormIsLoading, updateOutput]
  );

  const handlePaymentProviderChange = useCallback(
    (newProvider?: PaymentProviderInterface) => {
      manuallySelectedProviderIdRef.current = newProvider?.id;
      setPaymentProvider(newProvider);
    },
    [setPaymentProvider]
  );

  const refreshForm = useCallback(() => {
    dispatch(updatePairLimitsActions.submit({ fiatSymbol: inputCurrency.code, cryptoSlug: outputToken.slug }));
    if (!formIsLoading) {
      outputCalculationDataRef.current = { inputAmount, inputCurrency, outputToken };
      setFormIsLoading(true);
      updateOutput(inputAmount, inputCurrency, outputToken);
    }
  }, [inputCurrency, outputToken, formIsLoading, inputAmount, setFormIsLoading, updateOutput]);

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
