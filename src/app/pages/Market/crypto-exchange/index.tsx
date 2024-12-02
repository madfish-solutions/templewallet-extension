import React, { FC } from 'react';

import { PageModal } from 'app/atoms/PageModal';

import { OrderCreation } from './steps/OrderCreation';

interface Props {
  opened: boolean;
  onRequestClose: EmptyFn;
}

export const CryptoExchange: FC<Props> = ({ opened, onRequestClose }) => {
  return (
    <PageModal title="Crypto Exchange" opened={opened} onRequestClose={onRequestClose}>
      <OrderCreation />
    </PageModal>
  );
};
