import React, { FC, useCallback, useEffect, useState } from 'react';

import { FormProvider, useForm } from 'react-hook-form-v7';

import { dispatch } from 'app/store';
import { loadExolixCurrenciesActions } from 'app/store/crypto-exchange/actions';

import { INITIAL_INPUT_CURRENCY, INITIAL_OUTPUT_CURRENCY, ModalState } from '../../config';

import { FormContent } from './components/FormContent';
import { SelectCurrencyContent, SelectTokenContent } from './components/SelectCurrencyContent';
import { CryptoExchangeFormData } from './types';

const defaultFormData = {
  inputValue: '',
  inputCurrency: INITIAL_INPUT_CURRENCY,
  outputValue: '',
  outputCurrency: INITIAL_OUTPUT_CURRENCY
};

type ModalContent = 'form' | SelectTokenContent;

interface Props {
  setModalState: SyncFn<ModalState>;
}

export const OrderCreation: FC<Props> = ({ setModalState }) => {
  const [modalContent, setModalContent] = useState<ModalContent>('form');

  useEffect(() => void dispatch(loadExolixCurrenciesActions.submit()), []);

  const form = useForm<CryptoExchangeFormData>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: defaultFormData
  });

  const onGoBack = useCallback(() => setModalContent('form'), []);

  return (
    <FormProvider {...form}>
      {modalContent === 'form' ? (
        <FormContent setModalState={setModalState} setModalContent={setModalContent} />
      ) : (
        <SelectCurrencyContent content={modalContent} setModalState={setModalState} onGoBack={onGoBack} />
      )}
    </FormProvider>
  );
};
