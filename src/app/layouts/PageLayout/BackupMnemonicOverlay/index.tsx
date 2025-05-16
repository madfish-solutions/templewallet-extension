import React, { memo, useCallback, useRef, useState } from 'react';

import { ManualBackupModal } from 'app/templates/ManualBackupModal';
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

import { BackupOptionType } from './backup-option';
import { BackupOptionsModal } from './backup-options-modal';
import { GoogleBackupModal } from './google-backup-modal';

export const BackupMnemonicOverlay = memo(() => {
  const [backupType, setBackupType] = useState<BackupOptionType>();
  const [backupCredentials, setBackupCredentials] = useState<BackupCredentials>();
  const [, setShouldBackupMnemonic] = useStorage(SHOULD_BACKUP_MNEMONIC_STORAGE_KEY, false);
  const [, setInitToast] = useInitToastMessage();
  const nonceRef = useRef(0);

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

  const goToBackupOptions = useCallback(() => setBackupType(undefined), []);
  const goToManualBackup = useCallback(() => setBackupType('manual'), []);
  const handleSeedPhraseVerified = useCallback(() => {
    setInitToast(backupType === 'manual' ? t('backupSuccessful') : t('yourWalletIsReady'));
    clearBackupCredentials();
    setShouldBackupMnemonic(false).catch(e => console.error(e));
  }, [setInitToast, backupType, setShouldBackupMnemonic]);

  switch (backupType) {
    case undefined:
      return <BackupOptionsModal onSelect={handleBackupOptionSelect} />;
    case 'manual':
      return (
        <ManualBackupModal
          isNewMnemonic
          mnemonic={backupCredentials?.mnemonic ?? ''}
          onSuccess={handleSeedPhraseVerified}
          onCancel={goToBackupOptions}
        />
      );
    default:
      return (
        <GoogleBackupModal
          backupCredentials={backupCredentials!}
          nonce={nonceRef.current}
          onCancel={goToBackupOptions}
          goToManualBackup={goToManualBackup}
          onSuccess={handleSeedPhraseVerified}
        />
      );
  }
});
