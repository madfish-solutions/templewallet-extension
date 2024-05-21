import React, { memo, useCallback, useState } from 'react';

import { ManualBackupModal } from 'app/templates/ManualBackupModal';
import { VerifySeedPhraseModal } from 'app/templates/VerifySeedPhraseModal';
import { toastError, toastSuccess } from 'app/toaster';
import { SHOULD_BACKUP_MNEMONIC_STORAGE_KEY } from 'lib/constants';
import { t } from 'lib/i18n';
import { useStorage } from 'lib/temple/front';
import { getMnemonicToBackup } from 'lib/temple/front/mnemonic-to-backup-keeper';

import { BackupOptionsModal } from './backup-options-modal';

export const BackupMnemonicOverlay = memo(() => {
  // TODO: change state to support both Google Drive and manual backups
  const [backupSelected, setBackupSelected] = useState(false);
  const [mnemonicToBackup, setMnemonicToBackup] = useState('');
  const [shouldVerifySeedPhrase, setShouldVerifySeedPhrase] = useState(false);
  const [seedPhraseVerified, setSeedPhraseVerified] = useState(false);
  const [shouldBackupMnemonic, setShouldBackupMnemonic] = useStorage(SHOULD_BACKUP_MNEMONIC_STORAGE_KEY, false);

  const handleBackupOptionSelect = useCallback(() => {
    const currentMnemonicToBackup = getMnemonicToBackup();
    if (currentMnemonicToBackup) {
      setBackupSelected(true);
      setMnemonicToBackup(currentMnemonicToBackup);
    } else {
      toastError(t('failedToLoadMnemonic'));
    }
  }, []);

  const goToVerifySeedPhrase = useCallback(() => setShouldVerifySeedPhrase(true), []);
  const goToBackupOptions = useCallback(() => {
    setBackupSelected(false);
    setShouldVerifySeedPhrase(false);
  }, []);
  const goToManualBackup = useCallback(() => setShouldVerifySeedPhrase(false), []);
  const handleSeedPhraseVerified = useCallback(() => {
    toastSuccess(t('walletCreatedSuccessfully'));
    setSeedPhraseVerified(true);
    setShouldBackupMnemonic(false).catch(console.error);
  }, [setShouldBackupMnemonic]);

  if (!shouldBackupMnemonic || seedPhraseVerified) {
    return null;
  }

  return (
    <>
      {!backupSelected && <BackupOptionsModal onSelect={handleBackupOptionSelect} />}
      <ManualBackupModal
        opened={backupSelected}
        mnemonic={mnemonicToBackup}
        onSuccess={goToVerifySeedPhrase}
        onBack={goToBackupOptions}
      />
      <VerifySeedPhraseModal
        opened={shouldVerifySeedPhrase}
        mnemonic={mnemonicToBackup}
        onSuccess={handleSeedPhraseVerified}
        onBack={goToManualBackup}
        onClose={goToBackupOptions}
      />
    </>
  );
});
