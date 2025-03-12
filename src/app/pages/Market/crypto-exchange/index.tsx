import React, { FC, useCallback, useState } from 'react';

import { PageModal } from 'app/atoms/PageModal';

import { defaultModalHeaderConfig } from './config';
import { CryptoExchangeDataProvider, useCryptoExchangeDataState } from './context';
import { ConvertationTracker } from './steps/ConvertationTracker';
import { Deposit } from './steps/Deposit';
import { OrderCreation, OrderCreationContent } from './steps/OrderCreation';

interface Props {
  opened: boolean;
  onRequestClose: EmptyFn;
}

export const CryptoExchange: FC<Props> = ({ opened, onRequestClose }) => {
  const [modalHeaderConfig, setModalHeaderConfig] = useState(defaultModalHeaderConfig);
  const [orderCreationContent, setOrderCreationContent] = useState<OrderCreationContent>('form');

  const { step } = useCryptoExchangeDataState();

  const handleClose = useCallback(() => {
    onRequestClose();
    setOrderCreationContent('form');
  }, [onRequestClose]);

  return (
    <PageModal opened={opened} onRequestClose={handleClose} {...modalHeaderConfig}>
      <CryptoExchangeDataProvider>
        {(() => {
          switch (step) {
            case 1:
              return <Deposit />;
            case 2:
            case 3:
              return <ConvertationTracker />;
            default:
              return (
                <OrderCreation
                  orderCreationContent={orderCreationContent}
                  setOrderCreationContent={setOrderCreationContent}
                  setModalHeaderConfig={setModalHeaderConfig}
                />
              );
          }
        })()}
      </CryptoExchangeDataProvider>
    </PageModal>
  );
};
