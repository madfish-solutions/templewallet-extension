import React, { memo, useState } from 'react';

import { ActionModal } from 'app/atoms/action-modal';
import { t } from 'lib/i18n';
import { StoredAccount } from 'lib/temple/types';
import { useVanishingState } from 'lib/ui/hooks';

import { ChainSelection } from './chain-selection';
import { PrivateKeyView } from './private-key-view';
import { RevealPrivateKeysForm } from './reveal-private-keys-form';
import { PrivateKeyPayload } from './types';

interface RevealPrivateKeyModalProps {
  account: StoredAccount;
  onClose: () => void;
}

export const RevealPrivateKeyModal = memo<RevealPrivateKeyModalProps>(({ account, onClose }) => {
  const [privateKeys, setPrivateKeys] = useVanishingState<PrivateKeyPayload[]>(30_000);
  const [selectedPrivateKey, setSelectedPrivateKey] = useState<PrivateKeyPayload | null>(null);

  return (
    <ActionModal title={t('revealPrivateKey')} onClose={onClose}>
      {privateKeys ? (
        selectedPrivateKey ? (
          <PrivateKeyView privateKey={selectedPrivateKey!} onClose={onClose} />
        ) : (
          <ChainSelection privateKeys={privateKeys} onSelect={setSelectedPrivateKey} onClose={onClose} />
        )
      ) : (
        <RevealPrivateKeysForm onReveal={setPrivateKeys} account={account} />
      )}
    </ActionModal>
  );
});
