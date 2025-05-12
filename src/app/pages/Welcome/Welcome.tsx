import React, { memo, useCallback, useState } from 'react';

import { IconBase } from 'app/atoms';
import { Lines } from 'app/atoms/Lines';
import { Logo } from 'app/atoms/Logo';
import { PageModal } from 'app/atoms/PageModal';
import { SocialButton } from 'app/atoms/SocialButton';
import { StyledButton } from 'app/atoms/StyledButton';
import { SuspenseContainer } from 'app/atoms/SuspenseContainer';
import { useABTestingLoading } from 'app/hooks/use-ab-testing-loading';
import { useSearchParamsBoolean } from 'app/hooks/use-search-params-boolean';
import { ReactComponent as GoogleDriveIcon } from 'app/icons/base/google_drive.svg';
import { ReactComponent as ImportedIcon } from 'app/icons/base/imported.svg';
import { ReactComponent as PlusIcon } from 'app/icons/base/plus.svg';
import PageLayout from 'app/layouts/PageLayout';
import { FeedbackModal } from 'app/layouts/PageLayout/FeedbackModal';
import { CreatePasswordForm } from 'app/templates/CreatePasswordForm';
import { ImportSeedForm } from 'app/templates/ImportSeedForm';
import { t, T } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';
import { NullComponent } from 'lib/ui/null-component';
import { goBack, useLocation } from 'lib/woozie';

import { WelcomeSelectors } from './Welcome.selectors';

const Welcome = memo(() => {
  useABTestingLoading();
  const { historyPosition } = useLocation();

  const [isFeedbackModalOpen, setFeedbackModalOpened, setFeedbackModalClosed] = useBooleanState(false);

  const { value: isImport, setTrue: switchToImport, setFalse: cancelImport } = useSearchParamsBoolean('import');

  const [seedPhrase, setSeedPhrase] = useState<string | undefined>();

  const [shouldShowPasswordForm, showPasswordForm, hidePasswordForm] = useBooleanState(false);

  const handleSeedPhraseSubmit = useCallback(
    (seed: string) => {
      setSeedPhrase(seed);
      showPasswordForm();
    },
    [showPasswordForm]
  );

  const closeModal = useCallback(() => {
    if (historyPosition === 0) {
      setSeedPhrase(undefined);
      hidePasswordForm();
      cancelImport();
    } else {
      goBack();
    }
  }, [cancelImport, hidePasswordForm, historyPosition]);

  const handleGoBack = useCallback(
    () => void (shouldShowPasswordForm && hidePasswordForm()),
    [hidePasswordForm, shouldShowPasswordForm]
  );

  return (
    <PageLayout Header={NullComponent} contentPadding={false}>
      <PageModal
        title={t(shouldShowPasswordForm ? 'createPassword' : 'importExistingWallet')}
        opened={shouldShowPasswordForm || isImport}
        onGoBack={shouldShowPasswordForm && isImport ? handleGoBack : undefined}
        onRequestClose={closeModal}
      >
        <SuspenseContainer>
          {isImport && !shouldShowPasswordForm ? (
            <ImportSeedForm next={handleSeedPhraseSubmit} onCancel={closeModal} />
          ) : (
            <CreatePasswordForm seedPhrase={seedPhrase} />
          )}
        </SuspenseContainer>
      </PageModal>

      <div className="flex-1 flex flex-col px-4 pb-8 h-full">
        <div className="flex-1 flex flex-col justify-center items-center">
          <Logo type="icon-title" size={40} className="mb-6" />
          <span className="text-font-description-bold text-center pb-3">
            <T id="welcomeQuote" />
          </span>
          <span className="text-font-small text-center text-grey-1">
            <T id="welcomeQuoteAuthor" />
          </span>
        </div>

        <div className="flex flex-col gap-4">
          <SocialButton
            className="w-full"
            onClick={setFeedbackModalOpened}
            testID={WelcomeSelectors.continueWithGoogleDrive}
          >
            <GoogleDriveIcon className="h-8 w-auto" />
            <span className="text-font-regular-bold">
              <T id="continueWithGoogleDrive" />
            </span>
          </SocialButton>

          <Lines type="or" />

          <StyledButton
            className="w-full flex justify-center gap-0.5"
            size="L"
            color="primary"
            testID={WelcomeSelectors.createNewWallet}
            onClick={showPasswordForm}
          >
            <IconBase Icon={PlusIcon} size={16} />
            <span>
              <T id="createNewWallet" />
            </span>
          </StyledButton>
          <StyledButton
            className="w-full flex justify-center gap-0.5"
            size="L"
            color="secondary"
            testID={WelcomeSelectors.importExistingWallet}
            onClick={switchToImport}
          >
            <IconBase Icon={ImportedIcon} size={16} />
            <span>
              <T id="importExistingWallet" />
            </span>
          </StyledButton>
        </div>
      </div>

      {isFeedbackModalOpen && <FeedbackModal isGoogleSyncFeature onClose={setFeedbackModalClosed} />}
    </PageLayout>
  );
});

export default Welcome;
