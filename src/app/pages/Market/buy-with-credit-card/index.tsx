import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { FormProvider, useForm } from 'react-hook-form-v7';

import { PageModal } from 'app/atoms/PageModal';
import { dispatch } from 'app/store';
import { loadAllCurrenciesActions } from 'app/store/buy-with-credit-card/actions';
import { useAccountAddressForTezos } from 'temple/front';

import {
  DEFAULT_EVM_OUTPUT_TOKEN,
  DEFAULT_INPUT_CURRENCY,
  DEFAULT_TEZOS_OUTPUT_TOKEN,
  defaultModalHeaderConfig
} from './config';
import { Form } from './contents/Form';
import { SelectCurrency } from './contents/SelectCurrency';
import { SelectProvider } from './contents/SelectProvider';
import { SelectToken } from './contents/SelectToken';
import { BuyWithCreditCardFormData } from './form-data.interface';
import { useErrorAlert } from './hooks/use-error-alert';
import { useFormInputsCallbacks } from './hooks/use-form-inputs-callbacks';
import { usePaymentProviders } from './hooks/use-payment-providers';

type ModalContent = 'form' | 'send' | 'get' | 'provider';

interface Props {
  opened: boolean;
  onRequestClose: EmptyFn;
}

export const BuyWithCreditCard: FC<Props> = ({ opened, onRequestClose }) => {
  const [modalContent, setModalContent] = useState<ModalContent>('form');
  const [modalHeaderConfig, setModalHeaderConfig] = useState(defaultModalHeaderConfig);

  const [formIsLoading, setFormIsLoading] = useState(false);
  const [lastFormRefreshTimestamp, setLastFormRefreshTimestamp] = useState(Date.now());

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
  } = useFormInputsCallbacks(form, updateOutputAmounts, formIsLoading, setFormIsLoading, setLastFormRefreshTimestamp);

  useErrorAlert(allPaymentProviders, providersErrors, inputCurrency, outputToken);

  useEffect(() => void dispatch(loadAllCurrenciesActions.submit()), []);

  const onGoBack = useCallback(() => {
    setModalHeaderConfig(defaultModalHeaderConfig);
    setModalContent('form');
  }, []);

  return (
    <PageModal opened={opened} onRequestClose={onRequestClose} {...modalHeaderConfig}>
      <FormProvider {...form}>
        {(() => {
          switch (modalContent) {
            case 'send':
              return (
                <SelectCurrency
                  setModalHeaderConfig={setModalHeaderConfig}
                  onCurrencySelect={handleInputAssetChange}
                  onGoBack={onGoBack}
                />
              );
            case 'get':
              return (
                <SelectToken
                  setModalHeaderConfig={setModalHeaderConfig}
                  onTokenSelect={handleOutputTokenChange}
                  onGoBack={onGoBack}
                />
              );
            case 'provider':
              return (
                <SelectProvider
                  setModalHeaderConfig={setModalHeaderConfig}
                  paymentProvidersToDisplay={paymentProvidersToDisplay}
                  lastFormRefreshTimestamp={lastFormRefreshTimestamp}
                  refreshForm={refreshForm}
                  onProviderSelect={handlePaymentProviderChange}
                  onGoBack={onGoBack}
                />
              );
            default:
              return (
                <Form
                  setModalContent={setModalContent}
                  formIsLoading={formIsLoading}
                  refreshForm={refreshForm}
                  lastFormRefreshTimestamp={lastFormRefreshTimestamp}
                  allPaymentProviders={allPaymentProviders}
                  providersErrors={providersErrors}
                  paymentProvidersToDisplay={paymentProvidersToDisplay}
                  setPaymentProvider={setPaymentProvider}
                  manuallySelectedProviderIdRef={manuallySelectedProviderIdRef}
                  onInputAmountChange={handleInputAmountChange}
                />
              );
          }
        })()}
      </FormProvider>
    </PageModal>
  );
};
