import React, { FC, useState } from 'react';

import { PageModal } from 'app/atoms/PageModal';

import { Steps } from './components/Stepper';
import { defaultModalHeaderConfig } from './config';
import { ExchangeDataProvider } from './context';
import { OrderCreation } from './steps/OrderCreation';

interface Props {
  opened: boolean;
  onRequestClose: EmptyFn;
}

export const CryptoExchange: FC<Props> = ({ opened, onRequestClose }) => {
  const [modalHeaderConfig, setModalHeaderConfig] = useState(defaultModalHeaderConfig);

  const [exchangeStep, setExchangeStep] = useState<Steps>(0);

  return (
    <PageModal opened={opened} onRequestClose={onRequestClose} {...modalHeaderConfig}>
      <ExchangeDataProvider>
        {(() => {
          switch (exchangeStep) {
            case 0:
              return <OrderCreation setModalHeaderConfig={setModalHeaderConfig} setExchangeStep={setExchangeStep} />;
            default:
              return null;
          }
        })()}
      </ExchangeDataProvider>
    </PageModal>
  );
};
