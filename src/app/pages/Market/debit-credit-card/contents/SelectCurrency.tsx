import React, { FC } from 'react';

import { ModalHeaderConfig } from '../../types';

interface Props {
  setModalHeaderConfig: SyncFn<ModalHeaderConfig>;
  onGoBack: EmptyFn;
}

export const SelectCurrency: FC<Props> = () => {
  return <div></div>;
};
