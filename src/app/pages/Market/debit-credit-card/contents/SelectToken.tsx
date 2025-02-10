import React, { FC, useLayoutEffect } from 'react';

import { BackButton } from 'app/atoms/PageModal';
import { t } from 'lib/i18n';

import { ModalHeaderConfig } from '../../types';

interface Props {
  setModalHeaderConfig: SyncFn<ModalHeaderConfig>;
  onGoBack: EmptyFn;
}

export const SelectToken: FC<Props> = ({ setModalHeaderConfig, onGoBack }) => {
  useLayoutEffect(
    () => void setModalHeaderConfig({ title: t('selectToken'), titleLeft: <BackButton onClick={onGoBack} /> }),
    []
  );

  return <div></div>;
};
