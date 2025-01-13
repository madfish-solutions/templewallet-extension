import React, { memo, useCallback, useState } from 'react';

import { BackButton, PageModal } from 'app/atoms/PageModal';
import { ScrollView } from 'app/atoms/PageModal/scroll-view';
import { t } from 'lib/i18n';

import { PrivateKeyPayload } from '../types';

import { ChainSelection } from './chain-selection';
import { PrivateKeyView } from './private-key-view';
interface RevealPrivateKeyModalProps {
  privateKeys: PrivateKeyPayload[];
  onClose: EmptyFn;
}

export const RevealPrivateKeyModal = memo<RevealPrivateKeyModalProps>(({ privateKeys, onClose }) => {
  const [selectedPrivateKey, setSelectedPrivateKey] = useState<PrivateKeyPayload | null>(null);

  const unselectPrivateKey = useCallback(() => setSelectedPrivateKey(null), []);

  return (
    <PageModal
      title={t('revealPrivateKey')}
      onRequestClose={onClose}
      opened
      titleLeft={selectedPrivateKey ? <BackButton onClick={unselectPrivateKey} /> : undefined}
    >
      <ScrollView>
        {selectedPrivateKey ? (
          <PrivateKeyView privateKey={selectedPrivateKey} />
        ) : (
          <ChainSelection privateKeys={privateKeys} onSelect={setSelectedPrivateKey} />
        )}
      </ScrollView>
    </PageModal>
  );
});
