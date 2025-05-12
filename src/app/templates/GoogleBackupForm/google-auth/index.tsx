import React, { ReactNode, memo, useCallback, useEffect, useRef, useState } from 'react';

import { IconBase, Loader } from 'app/atoms';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as OkFillIcon } from 'app/icons/base/ok_fill.svg';
import { ReactComponent as XCircleFillIcon } from 'app/icons/base/x_circle_fill.svg';
import { FileDoesNotExistError, getAccountEmail, readGoogleDriveFile, getGoogleAuthToken } from 'lib/apis/google';
import { EnvVars } from 'lib/env';
import { T, TID } from 'lib/i18n';
import { EncryptedBackupObject, backupFileName } from 'lib/temple/backup';
import { useTempleClient } from 'lib/temple/front';

import { PageModalScrollViewWithActions } from '../../page-modal-scroll-view-with-actions';
import { GoogleBackupFormSelectors } from '../selectors';
import { AuthState, GoogleBackup } from '../types';

import { AuthIllustration } from './auth-illustration';

interface StateRenderParams {
  titleI18nKey: TID;
  descriptionI18nKey: TID;
  icon: ReactNode;
}

const stateRenderParams: Record<AuthState, StateRenderParams> = {
  active: {
    titleI18nKey: 'signInWithGoogle',
    descriptionI18nKey: 'signInWithGoogleToCreateWalletDescription',
    icon: <Loader size="L" trackVariant="dark" className="text-secondary" />
  },
  success: {
    titleI18nKey: 'accountConnected',
    descriptionI18nKey: 'accountConnectedDescription',
    icon: <IconBase Icon={OkFillIcon} size={24} className="text-success" />
  },
  error: {
    titleI18nKey: 'couldNotConnect',
    descriptionI18nKey: 'couldNotConnectGoogleAccountDescription',
    icon: <IconBase Icon={XCircleFillIcon} size={24} className="text-error" />
  }
};

interface GoogleAuthProps {
  next: SyncFn<GoogleBackup>;
}

export const GoogleAuth = memo<GoogleAuthProps>(({ next }) => {
  const { googleAuthToken, setGoogleAuthToken } = useTempleClient();
  const [isAuthError, setIsAuthError] = useState(false);
  const [backup, setBackup] = useState<GoogleBackup>();
  const googleAuthIframeRef = useRef<HTMLIFrameElement>(null);
  const authState = backup ? 'success' : isAuthError ? 'error' : 'active';
  const { titleI18nKey, descriptionI18nKey, icon } = stateRenderParams[authState];

  const handleGoogleAuthToken = useCallback(async (authToken: string) => {
    const [emailResult, contentResult] = await Promise.allSettled([
      getAccountEmail(authToken),
      readGoogleDriveFile<EncryptedBackupObject>(backupFileName, authToken)
    ]);

    if (emailResult.status === 'rejected') {
      console.error(emailResult.reason);
      setIsAuthError(true);
    } else if (contentResult.status === 'rejected' && contentResult.reason instanceof FileDoesNotExistError) {
      setBackup({ email: emailResult.value });
    } else if (contentResult.status === 'rejected') {
      console.error(contentResult.reason);
      setIsAuthError(true);
    } else {
      setBackup({ email: emailResult.value, content: contentResult.value });
    }
  }, []);

  const refreshGoogleAuthToken = useCallback(() => {
    setGoogleAuthToken(undefined);
    getGoogleAuthToken(googleAuthIframeRef, true)
      .then(setGoogleAuthToken)
      .catch(e => {
        console.error(e);
        setIsAuthError(true);
      });
  }, [setGoogleAuthToken]);

  const retry = useCallback(() => {
    setIsAuthError(false);

    if (googleAuthToken) {
      handleGoogleAuthToken(googleAuthToken);
    } else {
      refreshGoogleAuthToken();
    }
  }, [googleAuthToken, handleGoogleAuthToken, refreshGoogleAuthToken]);

  const isFirstMountRef = useRef(true);
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      refreshGoogleAuthToken();
    } else if (googleAuthToken) {
      handleGoogleAuthToken(googleAuthToken);
    }
  }, [googleAuthToken, handleGoogleAuthToken, refreshGoogleAuthToken]);

  const onContinueClick = useCallback(() => void (backup && next(backup)), [backup, next]);

  return (
    <PageModalScrollViewWithActions
      className="relative"
      initialBottomEdgeVisible
      actionsBoxProps={{
        children: (
          <StyledButton
            size="L"
            color="primary"
            type="button"
            disabled={authState === 'active'}
            testID={isAuthError ? GoogleBackupFormSelectors.retryButton : GoogleBackupFormSelectors.continueButton}
            onClick={isAuthError ? retry : onContinueClick}
          >
            <T id={isAuthError ? 'retry' : 'continue'} />
          </StyledButton>
        )
      }}
    >
      <iframe
        className="absolute top-0 left-0 w-1 h-1 invisible"
        src={EnvVars.GOOGLE_AUTH_PAGE_URL}
        title="Google Auth"
        ref={googleAuthIframeRef}
      />

      <div className="-mx-4">
        <AuthIllustration className="w-full h-auto" state={authState} />
      </div>

      <div className="flex flex-col items-center mb-4">
        <p className="mb-2 text-center text-font-regular-bold">
          <T id={titleI18nKey} />
        </p>

        <p className="mx-1 mb-6 text-center text-font-description text-grey-1">
          <T
            id={descriptionI18nKey}
            substitutions={
              authState === 'success' ? <span className="text-font-description-bold">{backup?.email}</span> : undefined
            }
          />
        </p>

        {icon}
      </div>
    </PageModalScrollViewWithActions>
  );
});
