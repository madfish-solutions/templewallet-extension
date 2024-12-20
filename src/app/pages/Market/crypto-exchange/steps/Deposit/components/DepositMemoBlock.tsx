import React, { memo, useCallback } from 'react';

import clsx from 'clsx';

import { IconButton } from 'app/atoms/IconButton';
import { ReactComponent as CopyIcon } from 'app/icons/base/copy.svg';
import { ReactComponent as QrCodeIcon } from 'app/icons/base/qr_code.svg';
import { toastSuccess } from 'app/toaster';
import { t, T } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';

import { CaptionAlert } from '../../../../../../atoms';
import { useCryptoExchangeDataState } from '../../../context';

import { DepositMemoQrCodeModal } from './DepositMemoQrCodeModal';

interface Props {
  className?: string;
}

export const DepositMemoBlock = memo<Props>(({ className }) => {
  const { exchangeData } = useCryptoExchangeDataState();

  const [isQrCodeModalOpened, openQrCodeModal, closeQrCodeModal] = useBooleanState(false);

  const handleCopyButtonClick = useCallback(() => {
    if (!exchangeData?.depositExtraId) return;

    window.navigator.clipboard.writeText(exchangeData.depositExtraId);
    toastSuccess(t('copiedAddress'));
  }, [exchangeData]);

  if (!exchangeData?.depositExtraId) return null;

  return (
    <>
      <div
        className={clsx(
          'flex justify-between items-center p-4 mb-4 rounded-lg shadow-bottom border-0.5 border-transparent',
          className
        )}
      >
        <div className="flex flex-col gap-y-1">
          <span className="text-font-regular-bold">
            <T id="memo" />
          </span>
          <span className="text-font-description text-grey-1 w-56 h-8 py-2 break-words">
            {exchangeData.depositExtraId}
          </span>
        </div>
        <div className="flex flex-row gap-x-2 self-end">
          <IconButton Icon={CopyIcon} color="blue" onClick={handleCopyButtonClick} />
          <IconButton Icon={QrCodeIcon} color="blue" onClick={openQrCodeModal} />
        </div>
      </div>

      <CaptionAlert
        type="warning"
        message={t('memoDisclaimer', [exchangeData.coinFrom.networkName])}
        className="mb-6"
      />

      {isQrCodeModalOpened && <DepositMemoQrCodeModal onClose={closeQrCodeModal} />}
    </>
  );
});
