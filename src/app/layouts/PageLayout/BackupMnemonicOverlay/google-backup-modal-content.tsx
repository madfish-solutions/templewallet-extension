import React, { memo, useCallback, useMemo, useRef, useState } from 'react';

import { Alert } from 'app/atoms';
import { DescriptionWithHeader } from 'app/atoms/Alert';
import { PageLoader } from 'app/atoms/Loader';
import { ScrollView } from 'app/atoms/PageModal/scroll-view';
import { DeleteBackupModal } from 'app/templates/delete-backup-modal';
import { GoogleAuth } from 'app/templates/google-auth';
import { GoogleBackupStatusModalContent } from 'app/templates/google-backup-status-modal-content';
import { T } from 'lib/i18n';
import { useTypedSWR } from 'lib/swr';
import { backupExists, writeGoogleDriveBackup } from 'lib/temple/backup';
import { useTempleClient } from 'lib/temple/front';
import { BackupCredentials } from 'lib/temple/front/mnemonic-to-backup-keeper';
import { useBooleanState } from 'lib/ui/hooks';

import { GoogleDriveBackupOption, GoogleDriveBackupOptionProps, IllustrationName } from './backup-option';
import { BackupMnemonicOverlaySelectors } from './selectors';

interface GoogleBackupModalContentProps {
  backupCredentials: BackupCredentials;
  googleBackupExists: boolean | undefined;
  nonce: number;
  goToManualBackup: EmptyFn;
  onBackupExists: SyncFn<boolean | undefined>;
  onFinish: EmptyFn;
}

export const GoogleBackupModalContent = memo<GoogleBackupModalContentProps>(
  ({ backupCredentials, googleBackupExists, nonce, onFinish, goToManualBackup, onBackupExists }) => {
    const { googleAuthToken, setGoogleAuthToken } = useTempleClient();
    const { mnemonic, password } = backupCredentials;
    const initialAuthTokenRef = useRef(googleAuthToken);
    const [isSuccess, setIsSuccess] = useState<boolean | undefined>();

    const initialGoogleBackupExistsSWRKey = useMemo(() => {
      const initialGoogleAuthToken = initialAuthTokenRef.current;

      return initialGoogleAuthToken ? ['google-backup-exists', initialGoogleAuthToken, nonce] : null;
    }, [nonce]);
    const getInitialBackupExists = useCallback(() => backupExists(initialAuthTokenRef.current!), []);
    const { data: initialGoogleBackupExists } = useTypedSWR(initialGoogleBackupExistsSWRKey, getInitialBackupExists, {
      suspense: true
    });

    const handleAuth = useCallback(
      async (currentGoogleAuthToken: string) => {
        try {
          const newGoogleBackupExists = await backupExists(currentGoogleAuthToken);
          onBackupExists(newGoogleBackupExists);

          if (newGoogleBackupExists) {
            return;
          }

          await writeGoogleDriveBackup(mnemonic, password, currentGoogleAuthToken);
          setIsSuccess(true);
        } catch (e) {
          console.error(e);
          setIsSuccess(false);
        }
      },
      [mnemonic, onBackupExists, password]
    );

    const goToSwitchAccount = useCallback(() => {
      setGoogleAuthToken(undefined);
      initialAuthTokenRef.current = undefined;
      onBackupExists(undefined);
    }, [onBackupExists, setGoogleAuthToken]);
    const handleSuccess = useCallback(() => setIsSuccess(true), []);

    if (isSuccess !== undefined) {
      return (
        <GoogleBackupStatusModalContent
          success={isSuccess}
          mnemonic={mnemonic}
          password={password}
          onSuccess={handleSuccess}
          onFinish={onFinish}
        />
      );
    }

    switch (googleBackupExists) {
      case undefined:
        return <GoogleAuth next={handleAuth} />;
      case false:
        return <PageLoader stretch />;
      default:
        return (
          <BackupExistsModalContent
            backupCredentials={backupCredentials}
            onSuccess={setIsSuccess}
            goToManualBackup={goToManualBackup}
            goToSwitchAccount={goToSwitchAccount}
          />
        );
    }
  }
);

type BackupExistsModalContentProps = Omit<
  GoogleBackupModalContentProps,
  'nonce' | 'googleBackupExists' | 'onBackupExists' | 'onFinish'
> & {
  goToSwitchAccount: EmptyFn;
  onSuccess: SyncFn<boolean>;
};

const BackupExistsModalContent = memo<BackupExistsModalContentProps>(
  ({ backupCredentials, onSuccess, goToManualBackup, goToSwitchAccount }) => {
    const [overwriteConfirmationModalOpened, openOverwriteConfirmationModal, closeOverwriteConfirmationModal] =
      useBooleanState(false);

    const optionsProps = useMemo<GoogleDriveBackupOptionProps[]>(
      () => [
        {
          type: 'switch-account',
          titleI18nKey: 'switchAccount',
          descriptionI18nKey: 'switchGoogleAccountDescription',
          testID: BackupMnemonicOverlaySelectors.switchAccountButton,
          illustrationName: IllustrationName.SwitchAccount,
          onClick: goToSwitchAccount
        },
        {
          type: 'manual',
          titleI18nKey: 'manualBackup',
          descriptionI18nKey: 'manualBackupDescription',
          testID: BackupMnemonicOverlaySelectors.manualBackupButton,
          illustrationName: IllustrationName.ManualBackup,
          onClick: goToManualBackup
        },
        {
          type: 'overwrite',
          titleI18nKey: 'overwriteBackup',
          descriptionI18nKey: 'overwriteBackupDescription',
          testID: BackupMnemonicOverlaySelectors.overwriteBackupButton,
          illustrationName: IllustrationName.OverwriteBackup,
          onClick: openOverwriteConfirmationModal
        }
      ],
      [goToManualBackup, goToSwitchAccount, openOverwriteConfirmationModal]
    );

    return (
      <>
        <ScrollView className="gap-4 p-4">
          <Alert
            description={
              <DescriptionWithHeader header={<T id="backupAlreadyExists" />}>
                <T id="backupAlreadyExistsDescription" />
              </DescriptionWithHeader>
            }
            type="warning"
          />
          <div className="flex flex-col gap-2">
            {optionsProps.map(({ type, ...restProps }) => (
              <GoogleDriveBackupOption key={type} type={type} {...restProps} />
            ))}
          </div>
        </ScrollView>

        {overwriteConfirmationModalOpened && (
          <OverwriteConfirmationModal
            backupCredentials={backupCredentials}
            onClose={closeOverwriteConfirmationModal}
            onSuccess={onSuccess}
          />
        )}
      </>
    );
  }
);

interface DeleteConfirmationModalProps {
  backupCredentials: BackupCredentials;
  onSuccess: SyncFn<boolean>;
  onClose: EmptyFn;
}

const OverwriteConfirmationModal = memo<DeleteConfirmationModalProps>(({ backupCredentials, onSuccess, onClose }) => {
  const { mnemonic, password } = backupCredentials;
  const { googleAuthToken } = useTempleClient();
  const overwriteBackup = useCallback(async () => {
    try {
      await writeGoogleDriveBackup(mnemonic, password, googleAuthToken!);
      onSuccess(true);
    } catch (e) {
      console.error(e);
      onSuccess(false);
    }
  }, [googleAuthToken, mnemonic, onSuccess, password]);

  return <DeleteBackupModal onCancel={onClose} onDelete={overwriteBackup} />;
});
