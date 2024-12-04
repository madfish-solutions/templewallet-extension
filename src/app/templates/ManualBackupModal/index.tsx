import React, { memo } from 'react';

import { BackButton, PageModal } from 'app/atoms/PageModal';
import { t } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';

import { MnemonicView } from './mnemonic-view';
import { VerifyMnemonicForm } from './verify-mnemonic-form';

interface ManualBackupModalProps {
  mnemonic: string;
  isNewMnemonic: boolean;
  animated?: boolean;
  onStartGoBack?: EmptyFn;
  onSuccess: EmptyFn;
  onCancel: EmptyFn;
}

export const ManualBackupModal = memo<ManualBackupModalProps>(
  ({ mnemonic, isNewMnemonic, animated = true, onSuccess, onCancel, onStartGoBack }) => {
    const [shouldVerifySeedPhrase, goToVerifySeedPhrase, goToManualBackup] = useBooleanState(false);

    return (
      <PageModal
        title={t(
          shouldVerifySeedPhrase ? 'verifySeedPhrase' : isNewMnemonic ? 'backupYourSeedPhrase' : 'revealSeedPhrase'
        )}
        animated={animated}
        opened
        titleLeft={
          (isNewMnemonic && shouldVerifySeedPhrase) || Boolean(onStartGoBack) ? (
            <BackButton onClick={shouldVerifySeedPhrase ? goToManualBackup : onStartGoBack ?? onCancel} />
          ) : null
        }
        onRequestClose={onCancel}
      >
        {shouldVerifySeedPhrase ? (
          <VerifyMnemonicForm mnemonic={mnemonic} onSuccess={onSuccess} />
        ) : (
          <MnemonicView mnemonic={mnemonic} isNewMnemonic={isNewMnemonic} onConfirm={goToVerifySeedPhrase} />
        )}
      </PageModal>
    );
  }
);
