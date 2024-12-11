import React, { memo } from 'react';

import { QRCode } from 'app/atoms';
import { ActionModal, ActionModalBodyContainer } from 'app/atoms/action-modal';
import { T } from 'lib/i18n';

import { CurrencyIcon } from '../../../components/CurrencyIcon';
import { useExchangeDataState } from '../../../context';

interface Props {
  onClose: EmptyFn;
}

export const DepositQrCodeModal = memo<Props>(({ onClose }) => {
  const { exchangeData } = useExchangeDataState();

  if (!exchangeData) return null;

  return (
    <ActionModal title="Deposit Address" hasCloseButton onClose={onClose} className="w-82" contentClassName="!w-full">
      <ActionModalBodyContainer className="items-center pt-4 pb-4">
        <div className="mt-2 mb-5 rounded-lg shadow-center overflow-hidden p-4">
          <QRCode size={188} data={exchangeData.depositAddress} />
        </div>

        <div className="flex flex-col justify-center items-center gap-y-2">
          <div className="flex flex-row gap-x-2">
            <CurrencyIcon src={exchangeData.coinFrom.icon} code={exchangeData.coinFrom.coinCode} size={24} />
            <span className="text-font-num-bold-16">{`${exchangeData.amount} ${exchangeData.coinFrom.coinCode}`}</span>
          </div>
          <span className="text-font-description">
            <T
              id="sendInOneTransaction"
              substitutions={[
                <span key="networkName" className="text-font-description-bold">
                  {exchangeData.coinFrom.networkName}
                </span>
              ]}
            />
          </span>
        </div>
      </ActionModalBodyContainer>
    </ActionModal>
  );
});
