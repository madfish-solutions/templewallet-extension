import React, { memo, useCallback, useMemo, useState } from 'react';

import { IconBase } from 'app/atoms';
import { Lines } from 'app/atoms/Lines';
import { PageModal } from 'app/atoms/PageModal';
import { SocialButton } from 'app/atoms/SocialButton';
import { StyledButton } from 'app/atoms/StyledButton';
import { useABTestingLoading } from 'app/hooks/use-ab-testing-loading';
import { useShouldShowIntroModals } from 'app/hooks/use-should-show-v2-intro-modal';
import { ReactComponent as ImportedIcon } from 'app/icons/base/imported.svg';
import { ReactComponent as PlusIcon } from 'app/icons/base/plus.svg';
import GoogleIconSrc from 'app/icons/google-logo.png';
import { PlanetsBgPageLayout } from 'app/layouts/planets-bg-page-layout';
import { CreatePasswordForm } from 'app/templates/CreatePasswordForm';
import { GoogleBackupStatusModalContent } from 'app/templates/google-backup-status-modal-content';
import { ImportSeedForm } from 'app/templates/ImportSeedForm';
import { t, T, TID } from 'lib/i18n';
import type { EncryptedBackupObject } from 'lib/temple/backup';
import { useTempleClient } from 'lib/temple/front';
import { useInitToastMessage } from 'lib/temple/front/toasts-context';
import { goBack, navigate, useLocation } from 'lib/woozie';

import { DecryptBackup } from './decrypt-backup';
import { GoogleAuth } from './google-auth';
import { WelcomeSelectors } from './Welcome.selectors';

enum WalletCreationStage {
  NotStarted = 'not-started',
  GoogleAuth = 'google-auth',
  GoogleBackupReading = 'google-backup-reading',
  GoogleBackupStatus = 'google-backup-status',
  ManualImport = 'manual-import',
  CreatePassword = 'create-password'
}

interface WalletCreationStateBase {
  stage: WalletCreationStage;
}

interface WalletCreationNotStartedState extends WalletCreationStateBase {
  stage: WalletCreationStage.NotStarted;
}

interface WalletCreationGoogleAuthState extends WalletCreationStateBase {
  stage: WalletCreationStage.GoogleAuth;
}

interface WalletCreationGoogleBackupReadingState extends WalletCreationStateBase {
  stage: WalletCreationStage.GoogleBackupReading;
  backupContent: EncryptedBackupObject;
}

interface WalletCreationGoogleBackupStatusState extends WalletCreationStateBase {
  stage: WalletCreationStage.GoogleBackupStatus;
  success: boolean;
  mnemonic: string;
  password: string;
}

interface WalletCreationManualImportState extends WalletCreationStateBase {
  stage: WalletCreationStage.ManualImport;
}

interface WalletCreationCreatePasswordState extends WalletCreationStateBase {
  stage: WalletCreationStage.CreatePassword;
  mnemonic?: string;
  backupPassword?: string;
  importType?: 'manual' | 'google';
}

type WalletCreationState =
  | WalletCreationNotStartedState
  | WalletCreationGoogleAuthState
  | WalletCreationGoogleBackupReadingState
  | WalletCreationGoogleBackupStatusState
  | WalletCreationManualImportState
  | WalletCreationCreatePasswordState;

const stageModalTitleI18nKeys: Record<WalletCreationStage, TID | null> = {
  [WalletCreationStage.NotStarted]: null,
  [WalletCreationStage.GoogleAuth]: 'continueWithGoogle',
  [WalletCreationStage.GoogleBackupReading]: 'continueWithGoogle',
  [WalletCreationStage.GoogleBackupStatus]: 'backupToGoogle',
  [WalletCreationStage.ManualImport]: 'importExistingWallet',
  [WalletCreationStage.CreatePassword]: 'createPassword'
};

const Welcome = memo(() => {
  useABTestingLoading();
  const { setGoogleAuthToken, setSuppressReady } = useTempleClient();
  const [, setInitToast] = useInitToastMessage();
  const { historyPosition } = useLocation();

  useShouldShowIntroModals(false);

  const [walletCreationState, setWalletCreationState] = useState<WalletCreationState>({
    stage: WalletCreationStage.NotStarted
  });
  const stage = walletCreationState.stage;
  const titleI18nKey = stageModalTitleI18nKeys[walletCreationState.stage];

  const handleBackupFinish = useCallback(() => {
    setInitToast(t('yourWalletIsReady'));
    setSuppressReady(false);
    navigate('/loading');
  }, [setInitToast, setSuppressReady]);
  const closeModal = useCallback(() => {
    if (historyPosition !== 0) {
      goBack();

      return;
    }

    if (stage === WalletCreationStage.GoogleBackupStatus) {
      handleBackupFinish();
    } else {
      setWalletCreationState({ stage: WalletCreationStage.NotStarted });
      setGoogleAuthToken(undefined);
    }
  }, [handleBackupFinish, historyPosition, setGoogleAuthToken, stage]);

  const goToGoogleAuth = useCallback(() => {
    setWalletCreationState({ stage: WalletCreationStage.GoogleAuth });
    setGoogleAuthToken(undefined);
  }, [setGoogleAuthToken]);
  const handleGoBack = useMemo(() => {
    switch (stage) {
      case WalletCreationStage.GoogleBackupReading:
        return goToGoogleAuth;
      case WalletCreationStage.CreatePassword:
        const { importType, mnemonic } = walletCreationState;

        if (importType === 'manual') {
          return () => setWalletCreationState({ stage: WalletCreationStage.ManualImport });
        }

        if (importType === 'google' && !mnemonic) {
          return goToGoogleAuth;
        }

        return undefined;
      default:
        return undefined;
    }
  }, [goToGoogleAuth, stage, walletCreationState]);

  const goToBackupReading = useCallback((backupContent: EncryptedBackupObject) => {
    setWalletCreationState({
      stage: WalletCreationStage.GoogleBackupReading,
      backupContent
    });
  }, []);
  const handleReadGoogleBackup = useCallback(
    (mnemonic?: string, backupPassword?: string) =>
      setWalletCreationState({
        stage: WalletCreationStage.CreatePassword,
        mnemonic,
        backupPassword,
        importType: 'google'
      }),
    []
  );
  const handleBackupSuccess = useCallback(
    () =>
      setWalletCreationState(state =>
        state.stage === WalletCreationStage.GoogleBackupStatus ? { ...state, success: true } : state
      ),
    []
  );
  const handleSeedPhraseSubmit = useCallback(
    (mnemonic: string) =>
      setWalletCreationState({ stage: WalletCreationStage.CreatePassword, mnemonic, importType: 'manual' }),
    []
  );
  const onCreateWalletClick = useCallback(
    () => setWalletCreationState({ stage: WalletCreationStage.CreatePassword }),
    []
  );
  const goToManualImport = useCallback(() => setWalletCreationState({ stage: WalletCreationStage.ManualImport }), []);
  const handleNewBackupState = useCallback(
    (mnemonic: string, password: string, success: boolean) =>
      setWalletCreationState({ stage: WalletCreationStage.GoogleBackupStatus, mnemonic, password, success }),
    []
  );

  const modalContent = useMemo(() => {
    switch (stage) {
      case WalletCreationStage.GoogleAuth:
        return <GoogleAuth onMissingBackup={handleReadGoogleBackup} onBackupContent={goToBackupReading} />;
      case WalletCreationStage.GoogleBackupReading:
        return <DecryptBackup next={handleReadGoogleBackup} backupContent={walletCreationState.backupContent} />;
      case WalletCreationStage.GoogleBackupStatus:
        return (
          <GoogleBackupStatusModalContent
            {...walletCreationState}
            onSuccess={handleBackupSuccess}
            onFinish={handleBackupFinish}
          />
        );
      case WalletCreationStage.ManualImport:
        return <ImportSeedForm next={handleSeedPhraseSubmit} />;
      case WalletCreationStage.CreatePassword:
        return <CreatePasswordForm {...walletCreationState} onNewBackupState={handleNewBackupState} />;
      default:
        return <></>;
    }
  }, [
    stage,
    goToBackupReading,
    handleBackupFinish,
    handleBackupSuccess,
    handleNewBackupState,
    handleReadGoogleBackup,
    handleSeedPhraseSubmit,
    walletCreationState
  ]);

  return (
    <>
      <PageModal
        title={titleI18nKey && t(titleI18nKey)}
        opened={stage !== WalletCreationStage.NotStarted}
        onGoBack={handleGoBack}
        onRequestClose={closeModal}
      >
        {modalContent}
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
          <SocialButton className="w-full" testID={WelcomeSelectors.continueWithGoogle} onClick={goToGoogleAuth}>
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
            onClick={onCreateWalletClick}
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
            onClick={goToManualImport}
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
