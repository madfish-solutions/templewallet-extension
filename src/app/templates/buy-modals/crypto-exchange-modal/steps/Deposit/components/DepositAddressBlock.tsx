import React, { memo } from 'react';

import clsx from 'clsx';

import { IconButton } from 'app/atoms/IconButton';
import { ReactComponent as CopyIcon } from 'app/icons/base/copy.svg';
import { ReactComponent as QrCodeIcon } from 'app/icons/base/qr_code.svg';
import { T } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';
import { useCopyText } from 'lib/ui/hooks/use-copy-text';

import { useCryptoExchangeDataState } from '../../../context';

import { DepositAddressQrCodeModal } from './DepositAddressQrCodeModal';

interface Props {
  className?: string;
}

export const DepositAddressBlock = memo<Props>(({ className }) => {
  const { exchangeData } = useCryptoExchangeDataState();

  const [isQrCodeModalOpened, openQrCodeModal, closeQrCodeModal] = useBooleanState(false);

  const handleCopyButtonClick = useCopyText(exchangeData?.depositAddress);

  if (!exchangeData) return null;

  return (
    <>
      <div
        className={clsx(
          'flex justify-between items-center p-4 rounded-lg shadow-bottom border-0.5 border-transparent',
          className
        )}
      >
        <div className="flex flex-col gap-y-1">
          <span className="text-font-regular-bold">
            <T id="depositAddress" />
          </span>
          <span className="text-font-description text-grey-1 w-56 h-8 break-words">{exchangeData.depositAddress}</span>
        </div>
        <div className="flex flex-row gap-x-2 self-end">
          <IconButton Icon={CopyIcon} color="blue" onClick={handleCopyButtonClick} />
          <IconButton Icon={QrCodeIcon} color="blue" onClick={openQrCodeModal} />
        </div>
      </div>

      {isQrCodeModalOpened && <DepositAddressQrCodeModal onClose={closeQrCodeModal} />}
    </>
  );
});
