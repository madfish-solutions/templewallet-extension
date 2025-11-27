import React, { FC } from 'react';

import { PageTitle } from 'app/atoms';
import PageLayout from 'app/layouts/PageLayout';
import { t } from 'lib/i18n';

import { CryptoExchangeDataProvider, useCryptoExchangeDataState } from './context';
import { ConvertationTracker } from './steps/ConvertationTracker';
import { Deposit } from './steps/Deposit';
import { OrderCreation } from './steps/OrderCreation';

export const CryptoExchange: FC = () => {
  return (
    <CryptoExchangeDataProvider>
      <Content />
    </CryptoExchangeDataProvider>
  );
};

const Content = () => {
  const { step } = useCryptoExchangeDataState();

  return (
    <PageLayout pageTitle={<PageTitle title={t('cryptoExchange')} />}>
      {(() => {
        switch (step) {
          case 1:
            return <Deposit />;
          case 2:
          case 3:
            return <ConvertationTracker />;
          default:
            return <OrderCreation />;
        }
      })()}
    </PageLayout>
  );
};
