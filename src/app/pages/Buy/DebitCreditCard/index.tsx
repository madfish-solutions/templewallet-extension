import React, { FC, useEffect, useMemo, useState } from 'react';

import { FormProvider, useForm } from 'react-hook-form-v7';

import { PageTitle } from 'app/atoms';
import PageLayout from 'app/layouts/PageLayout';
import { dispatch } from 'app/store';
import { loadAllCurrenciesActions } from 'app/store/buy-with-credit-card/actions';
import { t } from 'lib/i18n';
import { useBooleanState, useInterval } from 'lib/ui/hooks';
import { useAccountAddressForTezos } from 'temple/front';

import {
  DEFAULT_EVM_OUTPUT_TOKEN,
  DEFAULT_INPUT_CURRENCY,
  DEFAULT_TEZOS_OUTPUT_TOKEN,
  FORM_REFRESH_INTERVAL
} from './config';
import { Form } from './Form';
import { useErrorAlert } from './hooks/use-error-alert';
import { useFormInputsCallbacks } from './hooks/use-form-inputs-callbacks';
import { usePaymentProviders } from './hooks/use-payment-providers';
import { SelectCurrencyModal } from './modals/SelectCurrency';
import { SelectProviderModal } from './modals/SelectProvider';
import { SelectTokenModal } from './modals/SelectToken';
import { BuyWithCreditCardFormData } from './types';

export const DebitCreditCard: FC = () => {
  const [formIsLoading, setFormIsLoading] = useState(false);
  const [lastFormRefreshTimestamp, setLastFormRefreshTimestamp] = useState(Date.now());

  const [selectCurrencyModalOpened, openSelectCurrencyModal, closeSelectCurrencyModal] = useBooleanState(false);
  const [selectTokenModalOpened, openSelectTokenModal, closeSelectTokenModal] = useBooleanState(false);
  const [selectProviderModalOpened, openSelectProviderModal, closeSelectProviderModal] = useBooleanState(false);

  const tezosAddress = useAccountAddressForTezos();

  const defaultValues = useMemo<BuyWithCreditCardFormData>(
    () => ({
      inputCurrency: DEFAULT_INPUT_CURRENCY,
      outputToken: tezosAddress ? DEFAULT_TEZOS_OUTPUT_TOKEN : DEFAULT_EVM_OUTPUT_TOKEN
    }),
    [tezosAddress]
  );

  const form = useForm<BuyWithCreditCardFormData>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: defaultValues
  });

  const { watch } = form;

  const inputAmount = watch('inputAmount');
  const inputCurrency = watch('inputCurrency');
  const outputToken = watch('outputToken');

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

  useInterval(
    () => {
      refreshForm();
      setLastFormRefreshTimestamp(Date.now());
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
          lastFormRefreshTimestamp={lastFormRefreshTimestamp}
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
          lastFormRefreshTimestamp={lastFormRefreshTimestamp}
          onProviderSelect={handlePaymentProviderChange}
        />
      </FormProvider>
    </PageLayout>
  );
};
