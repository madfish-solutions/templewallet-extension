import React, { FC, useCallback, useMemo, useState } from 'react';

import { FormProvider, useForm } from 'react-hook-form-v7';

import { dispatch } from 'app/store';
import { loadExolixCurrenciesActions, loadExolixNetworksMapActions } from 'app/store/crypto-exchange/actions';
import { useBooleanState, useDidMount } from 'lib/ui/hooks';
import { useAccountAddressForTezos } from 'temple/front';

import {
  INITIAL_EVM_ACC_OUTPUT_CURRENCY,
  INITIAL_INPUT_CURRENCY,
  INITIAL_TEZOS_ACC_OUTPUT_CURRENCY
} from '../../config';

import { FormContent } from './components/FormContent';
import { SelectCurrencyModal, SelectTokenContent } from './components/SelectCurrencyModal';
import { CryptoExchangeFormData } from './types';

export const OrderCreation: FC = () => {
  const [modalContent, setModalContent] = useState<SelectTokenContent>('send');
  const [selectCurrencyModalOpened, openSelectCurrencyModal, closeSelectCurrencyModal] = useBooleanState(false);

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

  const handleSelectInputCurrency = useCallback(() => {
    setModalContent('send');
    openSelectCurrencyModal();
  }, [openSelectCurrencyModal]);

  const handleSelectOutputCurrency = useCallback(() => {
    setModalContent('get');
    openSelectCurrencyModal();
  }, [openSelectCurrencyModal]);

  return (
    <FormProvider {...form}>
      <FormContent
        onSelectInputCurrency={handleSelectInputCurrency}
        onSelectOutputCurrency={handleSelectOutputCurrency}
      />

      <SelectCurrencyModal
        content={modalContent}
        opened={selectCurrencyModalOpened}
        onRequestClose={closeSelectCurrencyModal}
      />
    </FormProvider>
  );
};
