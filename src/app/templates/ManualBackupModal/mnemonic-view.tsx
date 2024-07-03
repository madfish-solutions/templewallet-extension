import React, { memo, useMemo, useState } from 'react';

import { Alert } from 'app/atoms';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { ScrollView } from 'app/atoms/PageModal/scroll-view';
import { ReadOnlySecretField } from 'app/atoms/ReadOnlySecretField';
import { StyledButton } from 'app/atoms/StyledButton';
import { T, TID } from 'lib/i18n';

import { TestIDProps } from '../../../lib/analytics';

import { ManualBackupModalSelectors } from './selectors';

interface MnemonicViewProps extends TestIDProps {
  mnemonic: string;
  isNewMnemonic: boolean;
  onCancel?: EmptyFn;
  onConfirm: EmptyFn;
}

export const MnemonicView = memo<MnemonicViewProps>(({ mnemonic, isNewMnemonic, onCancel, onConfirm }) => {
  const [bottomEdgeIsVisible, setBottomEdgeIsVisible] = useState(true);

  const manualBackupSubstitutions = useMemo(() => {
    const i18nKeys: TID[] = isNewMnemonic ? ['neverShare', 'enterSeedPhrase'] : ['neverShare'];

    return i18nKeys.map(i18nKey => (
      <span className="font-semibold" key={i18nKey}>
        <T id={i18nKey} />
      </span>
    ));
  }, [isNewMnemonic]);

  return (
    <>
      <ScrollView
        className="py-4"
        bottomEdgeThreshold={16}
        onBottomEdgeVisibilityChange={setBottomEdgeIsVisible}
        testID={'what is this????'}
      >
        <Alert
          className="mb-4"
          type="warning"
          description={
            <T
              id={isNewMnemonic ? 'newMnemonicManualBackupWarning' : 'manualBackupWarning'}
              substitutions={manualBackupSubstitutions}
            />
          }
        />

        <ReadOnlySecretField
          value={mnemonic}
          label="newRevealSeedPhraseLabel"
          description={null}
          testID={ManualBackupModalSelectors.protectedMask}
        />
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
