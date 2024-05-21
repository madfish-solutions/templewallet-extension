import React, { memo, useCallback, useState } from 'react';

import { ManualBackupFlow } from 'app/templates/ManualBackupFlow';
import { toastError, toastSuccess } from 'app/toaster';
import { SHOULD_BACKUP_MNEMONIC_STORAGE_KEY } from 'lib/constants';
import { t } from 'lib/i18n';
import { useStorage } from 'lib/temple/front';
import { clearMnemonicToBackup, getMnemonicToBackup } from 'lib/temple/front/mnemonic-to-backup-keeper';

import { BackupOptionsModal } from './backup-options-modal';

export const BackupMnemonicOverlay = memo(() => {
  // TODO: change state to support both Google Drive and manual backups
  const [backupSelected, setBackupSelected] = useState(false);
  const [mnemonicToBackup, setMnemonicToBackup] = useState('');
  const [shouldBackupMnemonic, setShouldBackupMnemonic] = useStorage(SHOULD_BACKUP_MNEMONIC_STORAGE_KEY, false);

  const handleBackupOptionSelect = useCallback(async () => {
    const currentMnemonicToBackup = await getMnemonicToBackup();
    if (currentMnemonicToBackup) {
      setBackupSelected(true);
      setMnemonicToBackup(currentMnemonicToBackup);
    } else {
      toastError(t('failedToLoadMnemonic'));
    }
  }, []);

  const goToBackupOptions = useCallback(() => {
    setBackupSelected(false);
  }, []);
  const handleSeedPhraseVerified = useCallback(() => {
    toastSuccess(t('walletCreatedSuccessfully'));
    clearMnemonicToBackup();
    setShouldBackupMnemonic(false).catch(console.error);
  }, [setShouldBackupMnemonic]);

  if (!shouldBackupMnemonic) {
    return null;
  }

  return backupSelected ? (
    <ManualBackupFlow mnemonic={mnemonicToBackup} onSuccess={handleSeedPhraseVerified} onCancel={goToBackupOptions} />
  ) : (
    <BackupOptionsModal onSelect={handleBackupOptionSelect} />
  );
});
