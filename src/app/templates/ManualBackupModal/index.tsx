import React, { memo, useCallback, useState } from 'react';

import { PageModal } from 'app/atoms/PageModal';
import { t } from 'lib/i18n';

import { MnemonicView } from './mnemonic-view';
import { VerifyMnemonicView } from './verify-mnemonic-view';

interface ManualBackupModalProps {
  mnemonic: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ManualBackupModal = memo<ManualBackupModalProps>(({ mnemonic, onSuccess, onCancel }) => {
  const [shouldVerifySeedPhrase, setShouldVerifySeedPhrase] = useState(false);
  const goToManualBackup = useCallback(() => setShouldVerifySeedPhrase(false), []);
  const goToVerifySeedPhrase = useCallback(() => setShouldVerifySeedPhrase(true), []);

  return (
    <PageModal
      title={t(shouldVerifySeedPhrase ? 'verifySeedPhrase' : 'backupYourSeedPhrase')}
      opened
      shouldShowBackButton
      onGoBack={shouldVerifySeedPhrase ? goToManualBackup : onCancel}
      onRequestClose={onCancel}
    >
      {shouldVerifySeedPhrase ? (
        <VerifyMnemonicView mnemonic={mnemonic} onSuccess={onSuccess} onCancel={onCancel} />
      ) : (
        <MnemonicView mnemonic={mnemonic} onConfirm={goToVerifySeedPhrase} />
      )}
    </PageModal>
  );
});
