import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import axios from 'axios';
import { Controller, useFormContext, useFormState, SubmitHandler, useWatch } from 'react-hook-form';
import { useDebounce } from 'use-debounce';

import AssetField from 'app/atoms/AssetField';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { StyledButton } from 'app/atoms/StyledButton';
import { toastError } from 'app/toaster';
import { useFormAnalytics } from 'lib/analytics';
import { ExolixPairUnavailableError, getExolixPairKey } from 'lib/apis/exolix/pair';
import { loadMinMaxExchangeValues, queryExchange, submitExchange } from 'lib/apis/exolix/utils';
import { t, T } from 'lib/i18n';
import { useTypedSWR } from 'lib/swr';
import { shouldDisableSubmitButton } from 'lib/ui/should-disable-submit-button';
import { useAccountAddressForEvm, useAccountAddressForTezos } from 'temple/front';

import { ErrorType, MinMaxDisplay } from '../../../../min-max-display';
import { StepLabel } from '../../../components/StepLabel';
import { Stepper } from '../../../components/Stepper';
import { EXOLIX_DECIMALS, TEZOS_EXOLIX_NETWORK_CODE } from '../../../config';
import { useCryptoExchangeDataState } from '../../../context';
import { getCurrencyDisplayCode } from '../../../utils';
import { CryptoExchangeFormData } from '../types';

import { InfoCard } from './InfoCard';
import { SelectCurrencyButton } from './SelectCurrencyButton';

const TEN_SECONDS_IN_MS = 10_000;

const DEFAULT_SWR_CONFIG = {
  shouldRetryOnError: false,
  focusThrottleInterval: TEN_SECONDS_IN_MS,
  refreshInterval: TEN_SECONDS_IN_MS,
  dedupingInterval: TEN_SECONDS_IN_MS
};

interface Props {
  onSelectInputCurrency: EmptyFn;
  onSelectOutputCurrency: EmptyFn;
}

export const FormContent: FC<Props> = ({ onSelectInputCurrency, onSelectOutputCurrency }) => {
  const formAnalytics = useFormAnalytics('ExolixOrderCreationForm');

  const evmAddress = useAccountAddressForEvm();
  const tezosAddress = useAccountAddressForTezos();

  const { setExchangeData, setStep } = useCryptoExchangeDataState();

  const { control, handleSubmit, trigger, setValue } = useFormContext<CryptoExchangeFormData>();
  // React Compiler caches `<FormProvider {...form}>` on RHF's stable form, so context consumers stop re-rendering
  const formState = useFormState<CryptoExchangeFormData>({ control });
  const { isSubmitting, errors } = formState;
  const scrollContainerRef = useRef<HTMLFormElement>(null);

  const inputValue = useWatch({ control, name: 'inputValue' });
  const [inputValueDebounced] = useDebounce(inputValue, 300);

  const inputCurrency = useWatch({ control, name: 'inputCurrency' });
  const outputCurrency = useWatch({ control, name: 'outputCurrency' });
  const pairKey = getExolixPairKey({
    coinFrom: inputCurrency.code,
    networkFrom: inputCurrency.network.code,
    coinTo: outputCurrency.code,
    networkTo: outputCurrency.network.code
  });
  const [unavailablePairs, setUnavailablePairs] = useState<string[]>([]);
  const isPairUnavailable = unavailablePairs.includes(pairKey);

  const handlePairError = (error: unknown): void => {
    if (error instanceof ExolixPairUnavailableError) {
      setUnavailablePairs(pairs => (pairs.includes(error.pairKey) ? pairs : [...pairs, error.pairKey]));
    }
  };

  useEffect(() => {
    if (isPairUnavailable) toastError(t('pairNotAvailable'));
  }, [pairKey, isPairUnavailable]);

  const swrConfig = { ...DEFAULT_SWR_CONFIG, onError: handlePairError };

  const { data: minMaxData, isValidating: isMinMaxLoading } = useTypedSWR(
    isPairUnavailable ? null : ['exolix/api/min-max', pairKey],
    () =>
      loadMinMaxExchangeValues(
        inputCurrency.code,
        inputCurrency.network.code,
        outputCurrency.code,
        outputCurrency.network.code
      ),
    swrConfig
  );

  const minMaxDataRef = useRef(minMaxData);

  useEffect(() => {
    if (minMaxDataRef.current !== minMaxData && inputValue) {
      trigger('inputValue');
      minMaxDataRef.current = minMaxData;
    }
  }, [inputValue, minMaxData, trigger]);

  const { data: ratesData, isValidating: isRatesLoading } = useTypedSWR(
    isPairUnavailable || !minMaxData ? null : ['exolix/api/rate', pairKey, minMaxData, inputValueDebounced],
    () => {
      const amount = getParsedAmount(inputValueDebounced);

      if (!minMaxData || amount < minMaxData.finalMinAmount || amount > minMaxData.finalMaxAmount) {
        return;
      }

      return queryExchange({
        coinFrom: inputCurrency.code,
        networkFrom: inputCurrency.network.code,
        amount,
        coinTo: outputCurrency.code,
        networkTo: outputCurrency.network.code
      });
    },
    swrConfig
  );

  const { rate, toAmount } = useMemo(
    () =>
      ratesData && 'rate' in ratesData
        ? { rate: ratesData.rate, toAmount: ratesData.toAmount }
        : { rate: null, toAmount: 0 },
    [ratesData]
  );

  const withdrawalAddress = useMemo(() => {
    if (outputCurrency.network.code === TEZOS_EXOLIX_NETWORK_CODE) {
      return tezosAddress;
    }

    return evmAddress;
  }, [evmAddress, outputCurrency.network.code, tezosAddress]);

  const handleMinClick = useCallback(
    () => minMaxData && setValue('inputValue', minMaxData.finalMinAmount.toString(), { shouldValidate: true }),
    [minMaxData, setValue]
  );
  const handleMaxClick = useCallback(
    () => minMaxData && setValue('inputValue', minMaxData.finalMaxAmount.toString(), { shouldValidate: true }),
    [minMaxData, setValue]
  );

  const validateInputValue = useCallback(
    (value: string) => {
      if (!value || !minMaxData) return ErrorType.min;

      const amount = Number(value);
      const { finalMinAmount, finalMaxAmount } = minMaxData;

      if (amount < finalMinAmount) return ErrorType.min;
      if (amount > finalMaxAmount) return ErrorType.max;

      return true;
    },
    [minMaxData]
  );

  const onSubmit = useCallback<SubmitHandler<CryptoExchangeFormData>>(
    async ({ inputValue, inputCurrency, outputCurrency }) => {
      try {
        if (isSubmitting || isPairUnavailable || !withdrawalAddress) return;

        formAnalytics.trackSubmit();

        const amount = getParsedAmount(inputValue);

        const data = await submitExchange({
          coinFrom: inputCurrency.code,
          networkFrom: inputCurrency.network.code,
          coinTo: outputCurrency.code,
          networkTo: outputCurrency.network.code,
          amount,
          withdrawalAddress,
          withdrawalExtraId: ''
        });

        setExchangeData(data);
        setStep(1);

        formAnalytics.trackSubmitSuccess();
      } catch (e) {
        console.error(e);
        formAnalytics.trackSubmitFail();
        if (e instanceof ExolixPairUnavailableError) {
          handlePairError(e);
          return;
        }
        if (axios.isAxiosError(e) && e.response && e.response.status === 422) return;
        toastError('Something went wrong! Please try again later.');
      }
    },
    [formAnalytics, handlePairError, isPairUnavailable, isSubmitting, setExchangeData, setStep, withdrawalAddress]
  );

  return (
    <>
      <form
        ref={scrollContainerRef}
        id="create-order-form"
        className="flex-1 pt-4 px-4 flex flex-col overflow-y-auto"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Stepper currentStep={0} />

        <StepLabel title="exchangeDetails" description="exchangeDetailsDescription" />

        <Controller
          name="inputValue"
          control={control}
          rules={{ validate: validateInputValue }}
          render={({ field: { value, onChange, onBlur }, formState: { errors } }) => (
            <AssetField
              value={value}
              onBlur={onBlur}
              onChange={v => onChange(v ?? '')}
              assetDecimals={EXOLIX_DECIMALS}
              rightSideComponent={<SelectCurrencyButton currency={inputCurrency} onClick={onSelectInputCurrency} />}
              rightSideContainerStyle={{ right: 2 }}
              style={{ paddingRight: 158 }}
              underneathComponent={
                <MinMaxDisplay
                  currencyCode={getCurrencyDisplayCode(inputCurrency.code)}
                  min={minMaxData?.finalMinAmount}
                  max={minMaxData?.finalMaxAmount}
                  error={errors.inputValue}
                  onMinClick={handleMinClick}
                  onMaxClick={handleMaxClick}
                />
              }
              label={t('send')}
              placeholder="0.00"
              containerClassName="pb-7"
            />
          )}
        />

        <AssetField
          readOnly
          value={toAmount === 0 ? '' : toAmount}
          assetDecimals={EXOLIX_DECIMALS}
          rightSideComponent={<SelectCurrencyButton currency={outputCurrency} onClick={onSelectOutputCurrency} />}
          rightSideContainerStyle={{ right: 2 }}
          style={{ paddingRight: 158 }}
          label={t('get')}
          placeholder="0.00"
          shouldShowErrorCaption={false}
          containerClassName="pb-5"
        />

        <InfoCard rate={rate} inputCurrencyCode={inputCurrency.code} outputCurrencyCode={outputCurrency.code} />
      </form>

      <ActionsButtonsBox scrollContainerRef={scrollContainerRef}>
        <StyledButton
          type="submit"
          form="create-order-form"
          size="L"
          color="primary"
          loading={isSubmitting || isMinMaxLoading || isRatesLoading}
          disabled={shouldDisableSubmitButton({
            errors,
            formState,
            otherErrors: [isPairUnavailable || !toAmount ? 'output-amount-missing' : null],
            disableWhileSubmitting: false
          })}
        >
          <T id="exchange" />
        </StyledButton>
      </ActionsButtonsBox>
    </>
  );
};

const getParsedAmount = (value: string, fallback = 0): number => {
  const parsedAmount = Number(value);

  return Number.isFinite(parsedAmount) ? parsedAmount : fallback;
};
