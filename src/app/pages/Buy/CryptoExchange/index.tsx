import React, { FC, useCallback, useState } from 'react';

import { PageTitle } from 'app/atoms';
import PageLayout from 'app/layouts/PageLayout';
import { t } from 'lib/i18n';

import { CryptoExchangeDataProvider, useCryptoExchangeDataState } from './context';
import { ConvertationTracker } from './steps/ConvertationTracker';
import { Deposit } from './steps/Deposit';
import { OrderCreation, OrderCreationContent } from './steps/OrderCreation';

export const CryptoExchange: FC = () => {
  const [orderCreationContent, setOrderCreationContent] = useState<OrderCreationContent>('form');

  const { step } = useCryptoExchangeDataState();

  const handleClose = useCallback(() => {
    setOrderCreationContent('form');
  }, []);

  return (
    <PageLayout pageTitle={<PageTitle title={t('cryptoExchange')} />}>
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
    </PageLayout>
  );
};
