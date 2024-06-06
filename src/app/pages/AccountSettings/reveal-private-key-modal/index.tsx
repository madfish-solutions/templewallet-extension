import React, { memo, useCallback, useState } from 'react';

import { PageModal } from 'app/atoms/PageModal';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { ScrollView } from 'app/atoms/PageModal/scroll-view';
import { StyledButton } from 'app/atoms/StyledButton';
import { T, t } from 'lib/i18n';

import { PrivateKeyPayload } from '../types';

import { ChainSelection } from './chain-selection';
import { PrivateKeyView } from './private-key-view';
interface RevealPrivateKeyModalProps {
  privateKeys: PrivateKeyPayload[];
  onClose: EmptyFn;
}

export const RevealPrivateKeyModal = memo<RevealPrivateKeyModalProps>(({ privateKeys, onClose }) => {
  const [selectedPrivateKey, setSelectedPrivateKey] = useState<PrivateKeyPayload | null>(null);
  const [bottomEdgeVisible, setBottomEdgeVisible] = useState(true);

  const unselectPrivateKey = useCallback(() => setSelectedPrivateKey(null), []);

  return (
    <PageModal
      title={t('revealPrivateKey')}
      onRequestClose={onClose}
      opened
      shouldShowBackButton={Boolean(selectedPrivateKey)}
      onGoBack={unselectPrivateKey}
    >
      <ScrollView onBottomEdgeVisibilityChange={setBottomEdgeVisible} bottomEdgeThreshold={16}>
        {selectedPrivateKey ? (
          <PrivateKeyView privateKey={selectedPrivateKey!} />
        ) : (
          <ChainSelection privateKeys={privateKeys} onSelect={setSelectedPrivateKey} />
        )}
      </ScrollView>
      <ActionsButtonsBox shouldCastShadow={!bottomEdgeVisible}>
        <StyledButton onClick={onClose} color="primary-low" size="L">
          <T id="cancel" />
        </StyledButton>
      </ActionsButtonsBox>
    </PageModal>
  );
});
