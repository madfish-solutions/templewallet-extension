import React, { FC, useState } from 'react';

import { PageModal } from 'app/atoms/PageModal';

import { defaultModalHeaderConfig } from './config';
import { CryptoExchangeDataProvider, useCryptoExchangeDataState } from './context';
import { Deposit } from './steps/Deposit';
import { OrderCreation } from './steps/OrderCreation';

interface Props {
  opened: boolean;
  onRequestClose: EmptyFn;
}

export const CryptoExchange: FC<Props> = ({ opened, onRequestClose }) => {
  const [modalHeaderConfig, setModalHeaderConfig] = useState(defaultModalHeaderConfig);

  const { step } = useCryptoExchangeDataState();

  return (
    <PageModal opened={opened} onRequestClose={onRequestClose} {...modalHeaderConfig}>
      <CryptoExchangeDataProvider>
        {(() => {
          switch (step) {
            case 0:
              return <OrderCreation setModalHeaderConfig={setModalHeaderConfig} />;
            case 1:
              return <Deposit />;
            default:
              return null;
          }
        })()}
      </CryptoExchangeDataProvider>
    </PageModal>
  );
};
