import React, { FC, memo, useCallback } from 'react';

import { ModalInfoBlock } from 'app/atoms/ModalInfoBlock';
import { PageModal } from 'app/atoms/PageModal';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { ScrollView } from 'app/atoms/PageModal/scroll-view';
import { StyledButton } from 'app/atoms/StyledButton';
import { useAllAccountsReactiveOnAddition } from 'app/hooks/use-all-accounts-reactive';
import { ReactComponent as DocumentsIcon } from 'app/icons/base/documents.svg';
import { ReactComponent as KeyIcon } from 'app/icons/base/key.svg';
import PageLayout from 'app/layouts/PageLayout';
import { toastSuccess } from 'app/toaster';
import { T, TID, t } from 'lib/i18n';

import { MnemonicForm } from './forms/mnemonic';
import { PrivateKeyForm } from './forms/private-key';
import { WatchOnlyForm } from './forms/watch-only';
import { ImportAccountSelectors } from './selectors';
import { ImportAccountFormProps } from './types';

export type ImportOptionSlug = 'private-key' | 'mnemonic' | 'watch-only';

interface ImportAccountModalProps {
  optionSlug?: ImportOptionSlug;
  shouldShowBackButton?: boolean;
  onGoBack?: EmptyFn;
  onRequestClose: EmptyFn;
  onSeedPhraseSelect?: EmptyFn;
  onPrivateKeySelect?: EmptyFn;
}

interface OptionContents {
  titleI18nKey: TID;
  Form: FC<ImportAccountFormProps>;
}

const options: Record<ImportOptionSlug, OptionContents> = {
  'private-key': {
    titleI18nKey: 'importPrivateKey',
    Form: PrivateKeyForm
  },
  mnemonic: {
    titleI18nKey: 'importSeedPhrase',
    Form: MnemonicForm
  },
  'watch-only': {
    titleI18nKey: 'watchOnlyAccount',
    Form: WatchOnlyForm
  }
};

export const ImportAccountModal = memo<ImportAccountModalProps>(
  ({ optionSlug, shouldShowBackButton, onGoBack, onRequestClose, onSeedPhraseSelect, onPrivateKeySelect }) => {
    useAllAccountsReactiveOnAddition();

    const option = optionSlug ? options[optionSlug] : undefined;

    const handleSuccess = useCallback(() => {
      onRequestClose();
      toastSuccess(t('importSuccessful'));
    }, [onRequestClose]);

    return (
      <PageLayout>
        <PageModal
          title={t(option?.titleI18nKey ?? 'importWallet')}
          opened
          onRequestClose={onRequestClose}
          shouldShowBackButton={shouldShowBackButton}
          onGoBack={onGoBack}
        >
          {option ? (
            <option.Form onSuccess={handleSuccess} />
          ) : (
            <>
              <ScrollView className="flex flex-col gap-3 py-4">
                <div className="p-1 flex flex-col gap-0.5">
                  <span className="text-font-description-bold">
                    <T id="typeOfImport" />
                  </span>
                  <span className="text-grey-1 text-font-description">
                    <T id="typeOfImportDescription" />
                  </span>
                </div>

                <ModalInfoBlock
                  Icon={DocumentsIcon}
                  headline={<T id="seedPhrase" />}
                  description={<T id="seedPhraseOptionDescription" />}
                  onClick={onSeedPhraseSelect}
                />

                <ModalInfoBlock
                  Icon={KeyIcon}
                  headline={<T id="privateKey" />}
                  description={<T id="privateKeyOptionDescription" />}
                  onClick={onPrivateKeySelect}
                />
              </ScrollView>
              <ActionsButtonsBox shouldCastShadow={false}>
                <StyledButton
                  size="L"
                  color="primary-low"
                  onClick={onRequestClose}
                  testID={ImportAccountSelectors.cancelButton}
                >
                  <T id="cancel" />
                </StyledButton>
              </ActionsButtonsBox>
            </>
          )}
        </PageModal>
      </PageLayout>
    );
  }
);
