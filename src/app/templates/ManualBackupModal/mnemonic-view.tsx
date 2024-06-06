import React, { memo, useMemo, useState } from 'react';

import { Alert } from 'app/atoms';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { ScrollView } from 'app/atoms/PageModal/scroll-view';
import { ReadOnlySecretField } from 'app/atoms/ReadOnlySecretField';
import { StyledButton } from 'app/atoms/StyledButton';
import { T } from 'lib/i18n';

import { ManualBackupModalSelectors } from './selectors';

interface MnemonicViewProps {
  mnemonic: string;
  isNewMnemonic: boolean;
  onCancel?: EmptyFn;
  onConfirm: EmptyFn;
}

export const MnemonicView = memo<MnemonicViewProps>(({ mnemonic, isNewMnemonic, onCancel, onConfirm }) => {
  const [bottomEdgeIsVisible, setBottomEdgeIsVisible] = useState(true);

  const manualBackupSubstitutions = useMemo(
    () =>
      ['neverShare' as const, 'enterSeedPhrase' as const].map(i18nKey => (
        <span className="font-semibold" key={i18nKey}>
          <T id={i18nKey} />
        </span>
      )),
    []
  );

  return (
    <>
      <ScrollView className="py-4" bottomEdgeThreshold={16} onBottomEdgeVisibilityChange={setBottomEdgeIsVisible}>
        <Alert
          className="mb-4"
          type="warning"
          description={<T id="manualBackupWarning" substitutions={manualBackupSubstitutions} />}
        />

        <ReadOnlySecretField value={mnemonic} label="newRevealSeedPhraseLabel" description={null} />
      </ScrollView>

      <ActionsButtonsBox shouldCastShadow={!bottomEdgeIsVisible}>
        {isNewMnemonic ? (
          <StyledButton
            className="w-full"
            size="L"
            color="primary"
            onClick={onConfirm}
            testID={ManualBackupModalSelectors.notedDownButton}
          >
            <T id="notedSeedPhraseDown" />
          </StyledButton>
        ) : (
          <StyledButton
            className="w-full"
            size="L"
            color="primary-low"
            onClick={onCancel}
            testID={ManualBackupModalSelectors.cancelButton}
          >
            <T id="cancel" />
          </StyledButton>
        )}
      </ActionsButtonsBox>
    </>
  );
});
