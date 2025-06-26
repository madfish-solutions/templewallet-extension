import React, { FC } from 'react';

import { CaptionAlert, QRCode } from 'app/atoms';
import { ActionModal, ActionModalBodyContainer } from 'app/atoms/action-modal';
import { T, t } from 'lib/i18n';

interface Props {
  payload: string;
  onClose: EmptyFn;
}

export const QrCodeModal: FC<Props> = ({ payload, onClose }) => (
  <ActionModal title={t('sync')} hasCloseButton onClose={onClose} className="w-82" contentClassName="!w-full">
    <ActionModalBodyContainer className="items-center pt-4 pb-4">
      <CaptionAlert type="warning" message={t('syncSettingsAlert')} />

      <div className="mt-2 mb-5 rounded-lg shadow-center overflow-hidden p-4">
        <QRCode size={188} data={payload} />
      </div>

      <p className="text-center text-grey-1 text-font-description">
        <T id="scanQRWithTempleMobile" />
      </p>
    </ActionModalBodyContainer>
  </ActionModal>
);
