import React, { memo, useCallback, useState } from 'react';

import { IconBase } from 'app/atoms';
import { Lines } from 'app/atoms/Lines';
import { PageModal } from 'app/atoms/PageModal';
import { SocialButton } from 'app/atoms/SocialButton';
import { StyledButton } from 'app/atoms/StyledButton';
import { SuspenseContainer } from 'app/atoms/SuspenseContainer';
import { useABTestingLoading } from 'app/hooks/use-ab-testing-loading';
import { useLocationSearchParamValue } from 'app/hooks/use-location';
import { ReactComponent as ImportedIcon } from 'app/icons/base/imported.svg';
import { ReactComponent as PlusIcon } from 'app/icons/base/plus.svg';
import GoogleIconSrc from 'app/icons/google-logo.png';
import { PlanetsBgPageLayout } from 'app/layouts/planets-bg-page-layout';
import { CreatePasswordForm } from 'app/templates/CreatePasswordForm';
import { GoogleBackupForm } from 'app/templates/GoogleBackupForm';
import { ImportSeedForm } from 'app/templates/ImportSeedForm';
import { t, T } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';
import { goBack, useLocation } from 'lib/woozie';

import { WelcomeSelectors } from './Welcome.selectors';

const MANUAL_IMPORT_TYPE = 'manual';
const GOOGLE_IMPORT_TYPE = 'google';

const Welcome = memo(() => {
  useABTestingLoading();
  const { historyPosition } = useLocation();

  const [importType, setImportType] = useLocationSearchParamValue('importType');
  const isManualImport = importType === MANUAL_IMPORT_TYPE;
  const isGoogleImport = importType === GOOGLE_IMPORT_TYPE;
  const cancelImport = useCallback(() => setImportType(null), [setImportType]);
  const switchToManualImport = useCallback(() => setImportType(MANUAL_IMPORT_TYPE), [setImportType]);
  const switchToGoogleImport = useCallback(() => setImportType(GOOGLE_IMPORT_TYPE), [setImportType]);

  const [backupPassword, setBackupPassword] = useState<string | undefined>();
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

  const handleGoogleBackup = useCallback(
    (seed?: string, password?: string) => {
      setSeedPhrase(seed);
      setBackupPassword(password);
      showPasswordForm();
    },
    [showPasswordForm]
  );

  return (
    <>
      <PageModal
        title={t(
          shouldShowPasswordForm ? 'createPassword' : isManualImport ? 'importExistingWallet' : 'continueWithGoogle'
        )}
        opened={shouldShowPasswordForm || isManualImport || isGoogleImport}
        onGoBack={shouldShowPasswordForm && isManualImport ? handleGoBack : undefined}
        onRequestClose={closeModal}
      >
        <SuspenseContainer>
          {shouldShowPasswordForm ? (
            <CreatePasswordForm seedPhrase={seedPhrase} backupPassword={backupPassword} />
          ) : isGoogleImport ? (
            <GoogleBackupForm next={handleGoogleBackup} />
          ) : (
            <ImportSeedForm next={handleSeedPhraseSubmit} />
          )}
        </SuspenseContainer>
      </PageModal>

      <PlanetsBgPageLayout containerClassName="pb-8">
        <div className="flex flex-col items-center mb-9">
          <p className="text-font-regular-bold text-center mb-0.5">
            <T id="welcomeTo" /> Temple
          </p>
          <p className="text-font-description text-center text-grey-1 mb-1">
            <T id="chooseTheBestWayToStart" />
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <SocialButton className="w-full" testID={WelcomeSelectors.continueWithGoogle} onClick={switchToGoogleImport}>
            <img src={GoogleIconSrc} alt="" className="h-6 w-auto p-1" />
            <span className="text-font-regular-bold">
              <T id="continueWithGoogle" />
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
            onClick={switchToManualImport}
          >
            <IconBase Icon={ImportedIcon} size={16} />
            <span>
              <T id="importExistingWallet" />
            </span>
          </StyledButton>
        </div>
      </PlanetsBgPageLayout>
    </>
  );
});

export default Welcome;
