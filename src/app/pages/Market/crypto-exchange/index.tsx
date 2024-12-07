import React, { FC, useState } from 'react';

import { PageModal } from 'app/atoms/PageModal';

import { defaultModalState } from './config';
import { OrderCreation } from './steps/OrderCreation';

interface Props {
  opened: boolean;
  onRequestClose: EmptyFn;
}

export const CryptoExchange: FC<Props> = ({ opened, onRequestClose }) => {
  const [modalState, setModalState] = useState(defaultModalState);

  return (
    <PageModal opened={opened} onRequestClose={onRequestClose} {...modalState}>
      <OrderCreation setModalState={setModalState} />
    </PageModal>
  );
};
