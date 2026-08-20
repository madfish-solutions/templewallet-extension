import React, { FC, useEffect, useRef, useState, startTransition } from 'react';

import { FormProvider, useForm, useWatch } from 'react-hook-form';

import { PageTitle } from 'app/atoms';
import { useLocationSearchParamValue } from 'app/hooks/use-location';
import PageLayout from 'app/layouts/PageLayout';
import { dispatch } from 'app/store';
import { loadAllCurrenciesActions } from 'app/store/buy-with-credit-card/actions';
import { toastInfo } from 'app/toaster';
import { getAssetSymbolToDisplay } from 'lib/buy-with-credit-card/get-asset-symbol-to-display';
import { fromTopUpTokenSlug } from 'lib/buy-with-credit-card/top-up-token-slug.utils';
import { t } from 'lib/i18n';
import { useBooleanState, useInterval } from 'lib/ui/hooks';
import { equalsIgnoreCase } from 'lib/utils';
import { TempleChainKind } from 'temple/types';

import {
  DEFAULT_INPUT_CURRENCY,
  DEFAULT_OUTPUT_TOKEN,
  DEFAULT_TEZOS_OUTPUT_TOKEN,
  FORM_REFRESH_INTERVAL
} from './config';
import { Form } from './Form';
import { useAllCryptoCurrencies } from './hooks/use-all-crypto-currencies';
import { useAllFiatCurrencies } from './hooks/use-all-fiat-currencies';
import { useErrorAlert } from './hooks/use-error-alert';
import { useFormInputsCallbacks } from './hooks/use-form-inputs-callbacks';
import { usePaymentProviders } from './hooks/use-payment-providers';
import { SelectCurrencyModal } from './modals/SelectCurrency';
import { SelectProviderModal } from './modals/SelectProvider';
import { SelectTokenModal } from './modals/SelectToken';
import { BuyWithCreditCardFormData } from './types';

export const DebitCreditCard: FC = () => {
  const [formIsLoading, setFormIsLoading] = useState(false);
  const [nextFormRefreshAttemptTimestamp, setNextFormRefreshAttemptTimestamp] = useState(
    () => Date.now() + FORM_REFRESH_INTERVAL
  );

  const [selectCurrencyModalOpened, openSelectCurrencyModal, closeSelectCurrencyModal] = useBooleanState(false);
  const [selectTokenModalOpened, openSelectTokenModal, closeSelectTokenModal] = useBooleanState(false);
  const [selectProviderModalOpened, openSelectProviderModal, closeSelectProviderModal] = useBooleanState(false);

  const [currencyParam] = useLocationSearchParamValue('currency');
  const [tokenParam] = useLocationSearchParamValue('token');

  const tokenChainKind = tokenParam ? fromTopUpTokenSlug(tokenParam)[1]?.toLowerCase() : undefined;
  const preferTezos = tokenChainKind === TempleChainKind.Tezos;

  const defaultValues: BuyWithCreditCardFormData = {
    inputCurrency: DEFAULT_INPUT_CURRENCY,
    outputToken: preferTezos ? DEFAULT_TEZOS_OUTPUT_TOKEN : DEFAULT_OUTPUT_TOKEN
  };

  const form = useForm<BuyWithCreditCardFormData>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues
  });

  const { control } = form;

  const inputAmount = useWatch({ name: 'inputAmount', control });
  const inputCurrency = useWatch({ name: 'inputCurrency', control });
  const outputToken = useWatch({ name: 'outputToken', control });
  const allFiatCurrencies = useAllFiatCurrencies(inputCurrency.code, outputToken.slug);
  const allCryptoCurrencies = useAllCryptoCurrencies();

  const presetsAppliedRef = useRef(false);

  useEffect(() => {
    if (presetsAppliedRef.current) return;
    if (!currencyParam && !tokenParam) return;
    if (currencyParam && allFiatCurrencies.length === 0) return;
    if (tokenParam && allCryptoCurrencies.length === 0) return;

    presetsAppliedRef.current = true;

    const presetCurrency = currencyParam
      ? allFiatCurrencies.find(({ code }) => equalsIgnoreCase(code, currencyParam))
      : undefined;
    const presetToken = tokenParam
      ? allCryptoCurrencies.find(({ slug }) => equalsIgnoreCase(slug, tokenParam))
      : undefined;

    if (presetCurrency) form.setValue('inputCurrency', presetCurrency);
    if (presetToken) {
      form.setValue('outputToken', presetToken);
      toastInfo(t('tokenIsReadyToBuy', getAssetSymbolToDisplay(presetToken)));
    }
  }, [currencyParam, tokenParam, allFiatCurrencies, allCryptoCurrencies, form]);

  const { allPaymentProviders, paymentProvidersToDisplay, providersErrors, updateOutputAmounts } = usePaymentProviders(
    inputAmount,
    inputCurrency,
    outputToken
  );

  const {
    handleInputAssetChange,
    handleInputAmountChange,
    handleOutputTokenChange,
    handlePaymentProviderChange,
    setPaymentProvider,
    manuallySelectedProviderIdRef,
    refreshForm
  } = useFormInputsCallbacks(form, updateOutputAmounts, formIsLoading, setFormIsLoading);

  useErrorAlert(allPaymentProviders, providersErrors, inputCurrency, outputToken);

  useEffect(() => void dispatch(loadAllCurrenciesActions.submit()), []);

  useEffect(() => {
    startTransition(() => setNextFormRefreshAttemptTimestamp(Date.now() + FORM_REFRESH_INTERVAL));
  }, [refreshForm]);

  useInterval(
    () => {
      refreshForm();
      setNextFormRefreshAttemptTimestamp(Date.now() + FORM_REFRESH_INTERVAL);
    },
    [refreshForm],
    FORM_REFRESH_INTERVAL,
    false
  );

  return (
    <PageLayout pageTitle={<PageTitle title={t('debitCreditCard')} />} contentPadding={false} noScroll>
      <FormProvider {...form}>
        <Form
          formIsLoading={formIsLoading}
          nextFormRefreshAttemptTimestamp={nextFormRefreshAttemptTimestamp}
          allPaymentProviders={allPaymentProviders}
          providersErrors={providersErrors}
          paymentProvidersToDisplay={paymentProvidersToDisplay}
          setPaymentProvider={setPaymentProvider}
          manuallySelectedProviderIdRef={manuallySelectedProviderIdRef}
          onInputAmountChange={handleInputAmountChange}
          onSelectCurrency={openSelectCurrencyModal}
          onSelectToken={openSelectTokenModal}
          onSelectProvider={openSelectProviderModal}
        />

        <SelectCurrencyModal
          title={t('selectCurrency')}
          opened={selectCurrencyModalOpened}
          onRequestClose={closeSelectCurrencyModal}
          onCurrencySelect={handleInputAssetChange}
        />

        <SelectTokenModal
          title={t('selectToken')}
          opened={selectTokenModalOpened}
          onRequestClose={closeSelectTokenModal}
          onTokenSelect={handleOutputTokenChange}
        />

        <SelectProviderModal
          title={t('selectProvider')}
          opened={selectProviderModalOpened}
          onRequestClose={closeSelectProviderModal}
          paymentProvidersToDisplay={paymentProvidersToDisplay}
          nextFormRefreshAttemptTimestamp={nextFormRefreshAttemptTimestamp}
          onProviderSelect={handlePaymentProviderChange}
        />
      </FormProvider>
    </PageLayout>
  );
};
