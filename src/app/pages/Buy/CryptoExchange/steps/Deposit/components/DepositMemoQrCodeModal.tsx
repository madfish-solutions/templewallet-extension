import React, { memo } from 'react';

import { QRCode } from 'app/atoms';
import { ActionModal, ActionModalBodyContainer } from 'app/atoms/action-modal';
import { t, T } from 'lib/i18n';

import { useCryptoExchangeDataState } from '../../../context';

interface Props {
  onClose: EmptyFn;
}

export const DepositMemoQrCodeModal = memo<Props>(({ onClose }) => {
  const { exchangeData } = useCryptoExchangeDataState();

  if (!exchangeData?.depositExtraId) return null;

  return (
    <ActionModal title={t('memo')} hasCloseButton onClose={onClose} className="w-82" contentClassName="w-full!">
      <ActionModalBodyContainer className="items-center pt-4 pb-4">
        <div className="mb-5 rounded-lg shadow-center overflow-hidden p-4">
          <QRCode size={188} data={exchangeData.depositExtraId} />
        </div>

        <div className="flex flex-col justify-center items-center gap-y-2 text-center">
          <span className="text-font-num-bold-16">{exchangeData.depositExtraId}</span>
          <span className="text-font-description text-grey-1">
            <T id="bothMemoAndAddressAreRequired" />
          </span>
        </div>
      </ActionModalBodyContainer>
    </ActionModal>
  );
});
