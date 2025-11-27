import React, { FC, useCallback, useMemo } from 'react';

import { FormProvider, useForm } from 'react-hook-form-v7';

import { ModalHeaderConfig } from 'app/atoms/PageModal';
import { dispatch } from 'app/store';
import { loadExolixCurrenciesActions, loadExolixNetworksMapActions } from 'app/store/crypto-exchange/actions';
import { useDidMount } from 'lib/ui/hooks';
import { useAccountAddressForTezos } from 'temple/front';

import {
  INITIAL_EVM_ACC_OUTPUT_CURRENCY,
  INITIAL_INPUT_CURRENCY,
  INITIAL_TEZOS_ACC_OUTPUT_CURRENCY
} from '../../config';

import { FormContent } from './components/FormContent';
import { SelectCurrencyContent, SelectTokenContent } from './components/SelectCurrencyContent';
import { CryptoExchangeFormData } from './types';

export type OrderCreationContent = 'form' | SelectTokenContent;

interface Props {
  setModalHeaderConfig: SyncFn<ModalHeaderConfig>;
  orderCreationContent: OrderCreationContent;
  setOrderCreationContent: SyncFn<OrderCreationContent>;
}

export const OrderCreation: FC<Props> = ({ orderCreationContent, setOrderCreationContent, setModalHeaderConfig }) => {
  const tezosAddress = useAccountAddressForTezos();

  useDidMount(() => {
    dispatch(loadExolixNetworksMapActions.submit());
    dispatch(loadExolixCurrenciesActions.submit());
  });

  const defaultFormData = useMemo(
    () => ({
      inputValue: '',
      inputCurrency: INITIAL_INPUT_CURRENCY,
      outputCurrency: tezosAddress ? INITIAL_TEZOS_ACC_OUTPUT_CURRENCY : INITIAL_EVM_ACC_OUTPUT_CURRENCY
    }),
    [tezosAddress]
  );

  const form = useForm<CryptoExchangeFormData>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: defaultFormData
  });

  const handleGoBack = useCallback(() => setOrderCreationContent('form'), [setOrderCreationContent]);

  return (
    <FormProvider {...form}>
      {orderCreationContent === 'form' ? (
        <FormContent setModalHeaderConfig={setModalHeaderConfig} setModalContent={setOrderCreationContent} />
      ) : (
        <SelectCurrencyContent
          content={orderCreationContent}
          setModalHeaderConfig={setModalHeaderConfig}
          onGoBack={handleGoBack}
        />
      )}
    </FormProvider>
  );
};
