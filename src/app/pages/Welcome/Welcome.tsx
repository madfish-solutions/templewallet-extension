import React, { memo, useCallback, useState } from 'react';

import { IconBase } from 'app/atoms';
import { Lines } from 'app/atoms/Lines';
import { Logo } from 'app/atoms/Logo';
import { SocialButton } from 'app/atoms/SocialButton';
import { StyledButton } from 'app/atoms/StyledButton';
import { StyledButtonLikeLink } from 'app/atoms/StyledButtonLikeLink';
import { useABTestingLoading } from 'app/hooks/use-ab-testing-loading';
import { ReactComponent as GoogleDriveIcon } from 'app/icons/base/google_drive.svg';
import { ReactComponent as ImportedIcon } from 'app/icons/base/imported.svg';
import { ReactComponent as PlusIcon } from 'app/icons/base/plus.svg';
import PageLayout from 'app/layouts/PageLayout';
import { CreatePasswordModal } from 'app/templates/CreatePasswordModal';
import { T } from 'lib/i18n';

import { WelcomeSelectors } from './Welcome.selectors';

const EmptyHeader = () => null;

const Welcome = memo(() => {
  useABTestingLoading();

  const [shouldShowPasswordModal, setShouldShowPasswordModal] = useState(false);
  const handleCreateNewWalletClick = useCallback(() => setShouldShowPasswordModal(true), []);
  const handleRequestClose = useCallback(() => setShouldShowPasswordModal(false), []);

  return (
    <PageLayout Header={EmptyHeader} contentPadding={false}>
      <CreatePasswordModal opened={shouldShowPasswordModal} onRequestClose={handleRequestClose} />

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
          <SocialButton className="w-full" testID={WelcomeSelectors.continueWithGoogleDrive}>
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
            onClick={handleCreateNewWalletClick}
          >
            <IconBase Icon={PlusIcon} size={16} />
            <span>
              <T id="createNewWallet" />
            </span>
          </StyledButton>
          <StyledButtonLikeLink
            className="w-full flex justify-center gap-0.5"
            size="L"
            color="secondary"
            testID={WelcomeSelectors.importExistingWallet}
            to="/import-wallet"
          >
            <IconBase Icon={ImportedIcon} size={16} />
            <span>
              <T id="importExistingWallet" />
            </span>
          </StyledButtonLikeLink>
        </div>
      </div>
    </PageLayout>
  );
});

export default Welcome;
