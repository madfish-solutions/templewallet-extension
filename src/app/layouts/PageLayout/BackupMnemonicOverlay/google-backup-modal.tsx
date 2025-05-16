import React, { memo, useCallback, useMemo, useRef, useState } from 'react';

import { Alert } from 'app/atoms';
import { DescriptionWithHeader } from 'app/atoms/Alert';
import { PageLoader } from 'app/atoms/Loader';
import { PageModal } from 'app/atoms/PageModal';
import { ScrollView } from 'app/atoms/PageModal/scroll-view';
import { DeleteBackupModal } from 'app/templates/delete-backup-modal';
import { GoogleAuth } from 'app/templates/google-auth';
import { fileExists, writeGoogleDriveFile } from 'lib/apis/google';
import { T, t } from 'lib/i18n';
import { useTypedSWR } from 'lib/swr';
import { backupFileName, toEncryptedBackup } from 'lib/temple/backup';
import { useTempleClient } from 'lib/temple/front';
import { BackupCredentials } from 'lib/temple/front/mnemonic-to-backup-keeper';
import { useBooleanState } from 'lib/ui/hooks';

import { GoogleDriveBackupOption, GoogleDriveBackupOptionProps, IllustrationName } from './backup-option';
import { BackupMnemonicOverlaySelectors } from './selectors';

interface GoogleBackupModalProps {
  backupCredentials: BackupCredentials;
  nonce: number;
  onCancel: EmptyFn;
  goToManualBackup: EmptyFn;
  onSuccess: EmptyFn;
}

export const GoogleBackupModal = memo<GoogleBackupModalProps>(({ onCancel, ...restProps }) => (
  <PageModal
    title={t('backupToGoogle')}
    opened
    suspenseErrorMessage={t('checkingBackupFromGoogleDrive')}
    onRequestClose={onCancel}
  >
    <GoogleBackupModalContent {...restProps} />
  </PageModal>
));

type GoogleBackupModalContentProps = Omit<GoogleBackupModalProps, 'onCancel'>;

const GoogleBackupModalContent = memo<GoogleBackupModalContentProps>(
  ({ backupCredentials, nonce, onSuccess, goToManualBackup }) => {
    const { googleAuthToken, setGoogleAuthToken } = useTempleClient();
    const initialAuthTokenRef = useRef(googleAuthToken);

    const initialGoogleBackupExistsSWRKey = useMemo(() => {
      const initialGoogleAuthToken = initialAuthTokenRef.current;

      return initialGoogleAuthToken ? ['google-backup-exists', initialGoogleAuthToken, nonce] : null;
    }, [nonce]);
    const getInitialBackupExists = useCallback(() => fileExists(backupFileName, initialAuthTokenRef.current!), []);
    const { data: initialGoogleBackupExists } = useTypedSWR(initialGoogleBackupExistsSWRKey, getInitialBackupExists, {
      suspense: true
    });
    const [googleBackupExists, setGoogleBackupExists] = useState(initialGoogleBackupExists);

    const handleAuth = useCallback(
      async (currentGoogleAuthToken: string) => {
        const newGoogleBackupExists = await fileExists(backupFileName, currentGoogleAuthToken);
        setGoogleBackupExists(newGoogleBackupExists);

        if (newGoogleBackupExists) {
          return;
        }

        const { mnemonic, password } = backupCredentials;
        await writeGoogleDriveFile(backupFileName, await toEncryptedBackup(mnemonic, password), currentGoogleAuthToken);
        onSuccess();
      },
      [backupCredentials, onSuccess]
    );

    const goToSwitchAccount = useCallback(() => {
      setGoogleAuthToken(undefined);
      initialAuthTokenRef.current = undefined;
      setGoogleBackupExists(undefined);
    }, [setGoogleAuthToken]);

    switch (googleBackupExists) {
      case undefined:
        return <GoogleAuth next={handleAuth} />;
      case false:
        return <PageLoader stretch />;
      default:
        return (
          <BackupExistsModalContent
            backupCredentials={backupCredentials}
            onSuccess={onSuccess}
            goToManualBackup={goToManualBackup}
            goToSwitchAccount={goToSwitchAccount}
          />
        );
    }
  }
);

type BackupExistsModalContentProps = Omit<GoogleBackupModalContentProps, 'nonce'> & {
  goToSwitchAccount: EmptyFn;
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
  onSuccess: EmptyFn;
  onClose: EmptyFn;
}

const OverwriteConfirmationModal = memo<DeleteConfirmationModalProps>(({ backupCredentials, onSuccess, onClose }) => {
  const { mnemonic, password } = backupCredentials;
  const { googleAuthToken } = useTempleClient();
  const overwriteBackup = useCallback(async () => {
    await writeGoogleDriveFile(backupFileName, await toEncryptedBackup(mnemonic, password), googleAuthToken!);
    onSuccess();
  }, [googleAuthToken, mnemonic, onSuccess, password]);

  return <DeleteBackupModal onCancel={onClose} onDelete={overwriteBackup} />;
});
