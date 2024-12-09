import React, { FC, useState } from 'react';

import { PageModal } from 'app/atoms/PageModal';

import { defaultModalHeaderConfig } from './config';
import { OrderCreation } from './steps/OrderCreation';

interface Props {
  opened: boolean;
  onRequestClose: EmptyFn;
}

export const CryptoExchange: FC<Props> = ({ opened, onRequestClose }) => {
  const [modalHeaderConfig, setModalHeaderConfig] = useState(defaultModalHeaderConfig);

  return (
    <PageModal opened={opened} onRequestClose={onRequestClose} {...modalHeaderConfig}>
      <OrderCreation setModalHeaderConfig={setModalHeaderConfig} />
    </PageModal>
  );
};
