import React, { memo } from 'react';

import { MnemonicView } from './mnemonic-view';
import { VerifyMnemonicForm } from './verify-mnemonic-form';

interface ManualBackupModalContentProps {
  shouldVerifySeedPhrase: boolean;
  mnemonic: string;
  isNewMnemonic: boolean;
  goToVerifySeedPhrase: EmptyFn;
  onSuccess: EmptyFn;
}

export const ManualBackupModalContent = memo<ManualBackupModalContentProps>(
  ({ shouldVerifySeedPhrase, mnemonic, isNewMnemonic, goToVerifySeedPhrase, onSuccess }) =>
    shouldVerifySeedPhrase ? (
      <VerifyMnemonicForm mnemonic={mnemonic} onSuccess={onSuccess} />
    ) : (
      <MnemonicView mnemonic={mnemonic} isNewMnemonic={isNewMnemonic} onConfirm={goToVerifySeedPhrase} />
    )
);
