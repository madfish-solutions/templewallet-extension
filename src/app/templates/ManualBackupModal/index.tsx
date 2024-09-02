import React, { memo } from 'react';

import { PageModal } from 'app/atoms/PageModal';
import { t } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';

import { MnemonicView } from './mnemonic-view';
import { VerifyMnemonicForm } from './verify-mnemonic-form';

interface ManualBackupModalProps {
  mnemonic: string;
  isNewMnemonic: boolean;
  onSuccess: EmptyFn;
  onCancel: EmptyFn;
}

export const ManualBackupModal = memo<ManualBackupModalProps>(({ mnemonic, onSuccess, onCancel, isNewMnemonic }) => {
  const [shouldVerifySeedPhrase, goToVerifySeedPhrase, goToManualBackup] = useBooleanState(false);

  return (
    <PageModal
      title={t(
        shouldVerifySeedPhrase ? 'verifySeedPhrase' : isNewMnemonic ? 'backupYourSeedPhrase' : 'revealSeedPhrase'
      )}
      opened
      shouldShowBackButton={isNewMnemonic && shouldVerifySeedPhrase}
      onGoBack={shouldVerifySeedPhrase ? goToManualBackup : onCancel}
      onRequestClose={onCancel}
    >
      {shouldVerifySeedPhrase ? (
        <VerifyMnemonicForm mnemonic={mnemonic} onSuccess={onSuccess} />
      ) : (
        <MnemonicView
          mnemonic={mnemonic}
          isNewMnemonic={isNewMnemonic}
          onCancel={onCancel}
          onConfirm={goToVerifySeedPhrase}
        />
      )}
    </PageModal>
  );
});
