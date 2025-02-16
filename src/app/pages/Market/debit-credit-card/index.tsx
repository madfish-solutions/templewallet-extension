import React, { FC, useCallback, useMemo, useState } from 'react';

import { FormProvider, useForm } from 'react-hook-form-v7';

import { PageModal } from 'app/atoms/PageModal';
import { useAccountAddressForTezos } from 'temple/front';

import {
  DEFAULT_EVM_OUTPUT_TOKEN,
  DEFAULT_INPUT_CURRENCY,
  DEFAULT_PROVIDER,
  DEFAULT_TEZOS_OUTPUT_TOKEN,
  defaultModalHeaderConfig,
  FormData
} from './config';
import { Form } from './contents/Form';
import { SelectCurrency } from './contents/SelectCurrency';
import { SelectProvider } from './contents/SelectProvider';
import { SelectToken } from './contents/SelectToken';

type ModalContent = 'form' | 'send' | 'get' | 'provider';

interface Props {
  opened: boolean;
  onRequestClose: EmptyFn;
}

export const DebitCreditCard: FC<Props> = ({ opened, onRequestClose }) => {
  const [modalContent, setModalContent] = useState<ModalContent>('form');
  const [modalHeaderConfig, setModalHeaderConfig] = useState(defaultModalHeaderConfig);

  const tezosAddress = useAccountAddressForTezos();

  const defaultFormData = useMemo<FormData>(
    () => ({
      inputValue: '',
      inputCurrency: DEFAULT_INPUT_CURRENCY,
      outputToken: tezosAddress ? DEFAULT_TEZOS_OUTPUT_TOKEN : DEFAULT_EVM_OUTPUT_TOKEN,
      provider: DEFAULT_PROVIDER
    }),
    [tezosAddress]
  );

  const form = useForm<FormData>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: defaultFormData
  });

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
              return <SelectCurrency setModalHeaderConfig={setModalHeaderConfig} onGoBack={onGoBack} />;
            case 'get':
              return <SelectToken setModalHeaderConfig={setModalHeaderConfig} onGoBack={onGoBack} />;
            case 'provider':
              return <SelectProvider setModalHeaderConfig={setModalHeaderConfig} onGoBack={onGoBack} />;
            default:
              return <Form setModalContent={setModalContent} />;
          }
        })()}
      </FormProvider>
    </PageModal>
  );
};
