import React, { memo, useMemo } from 'react';

import { Alert } from 'app/atoms';
import { PageModal } from 'app/atoms/PageModal';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { ScrollView } from 'app/atoms/PageModal/scroll-view';
import { ReadOnlySecretField } from 'app/atoms/ReadOnlySecretField';
import { StyledButton } from 'app/atoms/StyledButton';
import { T, t } from 'lib/i18n';

import { ManualBackupModalSelectors } from './selectors';

interface ManualBackupModalProps {
  opened: boolean;
  mnemonic: string;
  onSuccess: () => void;
  onBack: () => void;
}

export const ManualBackupModal = memo<ManualBackupModalProps>(({ opened, mnemonic, onSuccess, onBack }) => {
  const manualBackupSubstitutions = useMemo(
    () =>
      ['neverShareSeedPhrase' as const, 'enterSeedPhrase' as const].map(i18nKey => (
        <span className="font-semibold" key={i18nKey}>
          {t(i18nKey)}
        </span>
      )),
    []
  );

  return (
    <PageModal title={t('backupYourSeedPhrase')} opened={opened} onRequestClose={onBack} onGoBack={onBack}>
      <ScrollView className="py-4">
        <Alert
          className="mb-4"
          type="warning"
          description={<T id="manualBackupWarning" substitutions={manualBackupSubstitutions} />}
        />

        <ReadOnlySecretField value={mnemonic} label="newRevealSeedPhraseLabel" description={null} />
      </ScrollView>

      <ActionsButtonsBox>
        <StyledButton
          className="w-full"
          size="L"
          color="primary"
          onClick={onSuccess}
          testID={ManualBackupModalSelectors.notedDownButton}
        >
          {t('notedSeedPhraseDown')}
        </StyledButton>
      </ActionsButtonsBox>
    </PageModal>
  );
});
