import React, { memo, useCallback, useRef, useState } from 'react';

import { PageModal } from 'app/atoms/PageModal';
import { ManualBackupModalContent } from 'app/templates/manual-backup-modal-content';
import { toastError } from 'app/toaster';
import { SHOULD_BACKUP_MNEMONIC_STORAGE_KEY } from 'lib/constants';
import { t } from 'lib/i18n';
import { useStorage } from 'lib/temple/front';
import {
  BackupCredentials,
  clearBackupCredentials,
  getBackupCredentials
} from 'lib/temple/front/mnemonic-to-backup-keeper';
import { useInitToastMessage } from 'lib/temple/front/toasts-context';
import { useBooleanState } from 'lib/ui/hooks';

import { BackupOptionType } from './backup-option';
import { BackupOptionsModal } from './backup-options-modal';
import { GoogleBackupModalContent } from './google-backup-modal-content';

export const BackupMnemonicOverlay = memo(() => {
  const [backupType, setBackupType] = useState<BackupOptionType>();
  const isManualBackup = backupType === 'manual';
  const [backupCredentials, setBackupCredentials] = useState<BackupCredentials>();
  const [, setShouldBackupMnemonic] = useStorage(SHOULD_BACKUP_MNEMONIC_STORAGE_KEY, false);
  const [, setInitToast] = useInitToastMessage();
  const nonceRef = useRef(0);

  const [shouldVerifySeedPhrase, goToVerifySeedPhrase, goToBackupSeedPhrase] = useBooleanState(false);
  const [googleBackupExists, setGoogleBackupExists] = useState<boolean | undefined>(false);

  const handleBackupOptionSelect = useCallback(async (backupType: BackupOptionType) => {
    const newBackup = await getBackupCredentials();
    if (newBackup) {
      setBackupCredentials(newBackup);
      nonceRef.current += 1;
      setBackupType(backupType);
    } else {
      toastError(t('failedToLoadMnemonic'));
    }
  }, []);

  const goToBackupOptions = useCallback(() => {
    setBackupType(undefined);
    goToBackupSeedPhrase();
    setGoogleBackupExists(false);
  }, [goToBackupSeedPhrase]);
  const goToManualBackup = useCallback(() => {
    setBackupType('manual');
    setGoogleBackupExists(false);
  }, []);
  const handleBackupSuccess = useCallback(() => {
    setInitToast(isManualBackup ? t('backupSuccessful') : t('yourWalletIsReady'));
    clearBackupCredentials();
    setShouldBackupMnemonic(false).catch(e => console.error(e));
  }, [setInitToast, isManualBackup, setShouldBackupMnemonic]);

  if (!backupType) {
    return <BackupOptionsModal onSelect={handleBackupOptionSelect} />;
  }

  return (
    <PageModal
      title={t(
        isManualBackup
          ? shouldVerifySeedPhrase
            ? 'verifySeedPhrase'
            : 'backupYourSeedPhrase'
          : googleBackupExists === undefined
          ? 'continueWithGoogle'
          : 'backupToGoogle'
      )}
      opened
      suspenseErrorMessage={isManualBackup ? undefined : t('checkingBackupFromGoogleDrive')}
      onGoBack={shouldVerifySeedPhrase ? goToBackupSeedPhrase : undefined}
      onRequestClose={goToBackupOptions}
    >
      {isManualBackup ? (
        <ManualBackupModalContent
          shouldVerifySeedPhrase={shouldVerifySeedPhrase}
          mnemonic={backupCredentials!.mnemonic}
          isNewMnemonic
          goToVerifySeedPhrase={goToVerifySeedPhrase}
          onSuccess={handleBackupSuccess}
        />
      ) : (
        <GoogleBackupModalContent
          backupCredentials={backupCredentials!}
          nonce={nonceRef.current}
          goToManualBackup={goToManualBackup}
          onBackupExists={setGoogleBackupExists}
          onFinish={handleBackupSuccess}
        />
      )}
    </PageModal>
  );
});
