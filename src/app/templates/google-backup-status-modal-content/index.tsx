import React, { memo, useCallback, useState } from 'react';

import { Alert, IconBase } from 'app/atoms';
import { GoogleIllustration } from 'app/atoms/google-illustration';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as XCircleFillIcon } from 'app/icons/base/x_circle_fill.svg';
import { T } from 'lib/i18n';
import { writeGoogleDriveBackup } from 'lib/temple/backup';
import { useTempleClient } from 'lib/temple/front';

import { PageModalScrollViewWithActions } from '../page-modal-scroll-view-with-actions';

import BackupSuccessSrc from './backup-success.png';
import { GoogleBackupStatusModalSelectors } from './selectors';

interface GoogleBackupStatusModalContentProps {
  success: boolean;
  mnemonic: string;
  password: string;
  onSuccess: EmptyFn;
  onFinish: EmptyFn;
}

export const GoogleBackupStatusModalContent = memo<GoogleBackupStatusModalContentProps>(
  ({ success, mnemonic, password, onSuccess, onFinish }) => {
    const { googleAuthToken } = useTempleClient();
    const [isPending, setIsPending] = useState(false);

    const writeBackup = useCallback(async () => {
      try {
        setIsPending(true);
        await writeGoogleDriveBackup(mnemonic, password, googleAuthToken!);
        onSuccess();
      } catch (e) {
        console.error(e);
      } finally {
        setIsPending(false);
      }
    }, [googleAuthToken, mnemonic, onSuccess, password]);

    return (
      <PageModalScrollViewWithActions
        actionsBoxProps={{
          children: (
            <StyledButton
              color="primary"
              loading={isPending}
              onClick={success ? onFinish : writeBackup}
              size="L"
              testID={
                success ? GoogleBackupStatusModalSelectors.finishButton : GoogleBackupStatusModalSelectors.retryButton
              }
            >
              <T id={success ? 'finish' : 'retry'} />
            </StyledButton>
          )
        }}
      >
        <div className="-mx-4">
          {success ? (
            <img className="w-full h-auto" src={BackupSuccessSrc} alt="" />
          ) : (
            <GoogleIllustration className="w-full h-auto" state="error" />
          )}
        </div>

        <div className="flex-grow flex flex-col items-center mb-4">
          <p className="mb-2 text-center text-font-regular-bold">
            <T id={success ? 'walletLinkedWithGoogle' : 'couldNotBackupWallet'} />
          </p>

          <p className="mx-1 text-center text-font-description text-grey-1">
            <T id={success ? 'walletLinkedWithGoogleDescription' : 'couldNotBackupWalletDescription'} />
          </p>

          {!success && <IconBase Icon={XCircleFillIcon} size={24} className="text-error mt-6" />}
        </div>

        {success && <Alert className="mb-4" type="info" description={<T id="rememberGoogleBackupPassword" />} />}
      </PageModalScrollViewWithActions>
    );
  }
);
