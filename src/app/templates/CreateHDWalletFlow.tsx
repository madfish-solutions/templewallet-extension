import React, { memo, useCallback, useMemo } from 'react';

import { generateMnemonic } from 'bip39';

import { toastError, toastSuccess } from 'app/toaster';
import { t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';

import { ManualBackupFlow } from './ManualBackupFlow';

interface CreateHDWalletFlowProps {
  onEnd: () => void;
}

export const CreateHDWalletFlow = memo<CreateHDWalletFlowProps>(({ onEnd }) => {
  const mnemonic = useMemo(() => generateMnemonic(128), []);
  const { createOrImportWallet } = useTempleClient();

  const createWallet = useCallback(async () => {
    try {
      await createOrImportWallet(mnemonic);
      toastSuccess(t('walletCreatedSuccessfully'));
      onEnd();
    } catch (err: any) {
      console.error(err);

      toastError(err.message);
    }
  }, [createOrImportWallet, mnemonic, onEnd]);

  return <ManualBackupFlow mnemonic={mnemonic} onCancel={onEnd} onSuccess={createWallet} />;
});
