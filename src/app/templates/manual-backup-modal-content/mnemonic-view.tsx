import React, { memo, useMemo, useState } from 'react';

import { Alert } from 'app/atoms';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { ScrollView } from 'app/atoms/PageModal/scroll-view';
import { ReadOnlySecretField } from 'app/atoms/ReadOnlySecretField';
import { StyledButton } from 'app/atoms/StyledButton';
import { TestIDProps } from 'lib/analytics';
import { T, TID } from 'lib/i18n';

import { ManualBackupModalSelectors } from './selectors';

interface MnemonicViewProps extends TestIDProps {
  mnemonic: string;
  isNewMnemonic: boolean;
  onConfirm: EmptyFn;
}

export const MnemonicView = memo<MnemonicViewProps>(({ mnemonic, isNewMnemonic, onConfirm }) => {
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
      <ScrollView className="py-4" bottomEdgeThreshold={16} onBottomEdgeVisibilityChange={setBottomEdgeIsVisible}>
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

      {isNewMnemonic && (
        <ActionsButtonsBox shouldCastShadow={!bottomEdgeIsVisible}>
          <StyledButton
            className="w-full"
            size="L"
            color="primary"
            onClick={onConfirm}
            testID={ManualBackupModalSelectors.notedDownButton}
          >
            <T id="notedSeedPhraseDown" />
          </StyledButton>
        </ActionsButtonsBox>
      )}
    </>
  );
});
