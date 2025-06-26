import React, { memo, useCallback, useMemo } from 'react';

import { generateMnemonic } from 'bip39';

import { toastError, toastSuccess } from 'app/toaster';
import { t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';

import { ManualBackupModal } from './manual-backup-modal';

interface CreateHDWalletModalProps {
  animated?: boolean;
  onSuccess: EmptyFn;
  onClose: EmptyFn;
  onStartGoBack?: EmptyFn;
}

export const CreateHDWalletModal = memo<CreateHDWalletModalProps>(
  ({ animated = true, onClose, onSuccess, onStartGoBack }) => {
    const mnemonic = useMemo(() => generateMnemonic(128), []);
    const { createOrImportWallet } = useTempleClient();

    const createWallet = useCallback(async () => {
      try {
        await createOrImportWallet(mnemonic);
        toastSuccess(t('walletCreatedSuccessfully'));
        onSuccess();
      } catch (err: any) {
        console.error(err);

        toastError(err.message);
      }
    }, [createOrImportWallet, mnemonic, onSuccess]);

    return (
      <ManualBackupModal
        animated={animated}
        isNewMnemonic
        mnemonic={mnemonic}
        onCancel={onClose}
        onStartGoBack={onStartGoBack}
        onSuccess={createWallet}
      />
    );
  }
);
