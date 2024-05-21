import React, { memo, useCallback, useState } from 'react';

import { ManualBackupModal } from './ManualBackupModal';
import { VerifySeedPhraseModal } from './VerifySeedPhraseModal';

interface ManualBackupFlowProps {
  mnemonic: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ManualBackupFlow = memo<ManualBackupFlowProps>(({ mnemonic, onSuccess, onCancel }) => {
  const [shouldVerifySeedPhrase, setShouldVerifySeedPhrase] = useState(false);
  const goToManualBackup = useCallback(() => setShouldVerifySeedPhrase(false), []);
  const goToVerifySeedPhrase = useCallback(() => setShouldVerifySeedPhrase(true), []);

  return (
    <>
      <ManualBackupModal opened mnemonic={mnemonic} onSuccess={goToVerifySeedPhrase} onBack={onCancel} />
      <VerifySeedPhraseModal
        opened={shouldVerifySeedPhrase}
        mnemonic={mnemonic}
        onSuccess={onSuccess}
        onBack={goToManualBackup}
        onClose={onCancel}
      />
    </>
  );
});
