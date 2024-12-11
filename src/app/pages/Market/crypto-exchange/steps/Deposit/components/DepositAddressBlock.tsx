import React, { memo, useCallback } from 'react';

import clsx from 'clsx';

import { IconButton } from 'app/atoms/IconButton';
import { ReactComponent as CopyIcon } from 'app/icons/base/copy.svg';
import { ReactComponent as QrCodeIcon } from 'app/icons/base/qr_code.svg';
import { toastSuccess } from 'app/toaster';
import { T } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';

import { useExchangeDataState } from '../../../context';

import { DepositQrCodeModal } from './DepositQrCodeModal';

interface Props {
  className?: string;
}

export const DepositAddressBlock = memo<Props>(({ className }) => {
  const { exchangeData } = useExchangeDataState();

  const [isQrCodeModalOpened, openQrCodeModal, closeQrCodeModal] = useBooleanState(false);

  const handleCopyButtonClick = useCallback(() => {
    window.navigator.clipboard.writeText(exchangeData!.depositAddress);
    toastSuccess('Address Copied');
  }, [exchangeData]);

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
          <span className="text-font-description text-grey-1 max-w-56">{exchangeData.depositAddress}</span>
        </div>
        <div className="self-end">
          <IconButton Icon={CopyIcon} color="blue" onClick={handleCopyButtonClick} />
          <IconButton Icon={QrCodeIcon} color="blue" onClick={openQrCodeModal} />
        </div>
      </div>

      {isQrCodeModalOpened && <DepositQrCodeModal onClose={closeQrCodeModal} />}
    </>
  );
});
