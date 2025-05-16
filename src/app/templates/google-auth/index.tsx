import React, { ReactNode, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { IconBase, Loader } from 'app/atoms';
import { GoogleIllustration, GoogleIllustrationState } from 'app/atoms/google-illustration';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as OkFillIcon } from 'app/icons/base/ok_fill.svg';
import { ReactComponent as XCircleFillIcon } from 'app/icons/base/x_circle_fill.svg';
import { toastError } from 'app/toaster';
import { getAccountEmail, getGoogleAuthToken, getGoogleAuthPageUrl } from 'lib/apis/google';
import { T, TID, t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { serializeError } from 'lib/utils/serialize-error';

import { PageModalScrollViewWithActions } from '../page-modal-scroll-view-with-actions';

import { GoogleAuthSelectors } from './selectors';

interface StateRenderParams {
  titleI18nKey: TID;
  descriptionI18nKey: TID;
  icon: ReactNode;
}

const stateRenderParams: Record<GoogleIllustrationState, StateRenderParams> = {
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
  next: (googleAuthToken: string) => void | Promise<void>;
}

export const GoogleAuth = memo<GoogleAuthProps>(({ next }) => {
  const { googleAuthToken, setGoogleAuthToken } = useTempleClient();
  const [isAuthError, setIsAuthError] = useState(false);
  const [email, setEmail] = useState<string>();
  const googleAuthIframeRef = useRef<HTMLIFrameElement>(null);
  const authState = email ? 'success' : isAuthError ? 'error' : 'active';
  const { titleI18nKey, descriptionI18nKey, icon } = stateRenderParams[authState];

  const googleAuthPageUrl = useMemo(() => getGoogleAuthPageUrl(), []);

  const handleGoogleAuthToken = useCallback(async (authToken: string) => {
    try {
      setEmail(await getAccountEmail(authToken));
    } catch (e) {
      console.error(e);
      setIsAuthError(true);
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

  const [isLoading, setIsLoading] = useState(false);
  const onContinueClick = useCallback(async () => {
    if (!email) return;

    try {
      setIsLoading(true);
      await next(googleAuthToken!);
    } catch (e) {
      console.error(e);
      toastError(serializeError(e) ?? t('unknownError'));
    } finally {
      setIsLoading(false);
    }
  }, [email, googleAuthToken, next]);

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
            loading={isLoading}
            testID={isAuthError ? GoogleAuthSelectors.retryButton : GoogleAuthSelectors.continueButton}
            onClick={isAuthError ? retry : onContinueClick}
          >
            <T id={isAuthError ? 'retry' : 'continue'} />
          </StyledButton>
        )
      }}
    >
      <iframe
        className="absolute top-0 left-0 w-1 h-1 invisible"
        src={googleAuthPageUrl}
        title="Google Auth"
        ref={googleAuthIframeRef}
      />

      <div className="-mx-4">
        <GoogleIllustration className="w-full h-auto" state={authState} />
      </div>

      <div className="flex flex-col items-center mb-4">
        <p className="mb-2 text-center text-font-regular-bold">
          <T id={titleI18nKey} />
        </p>

        <p className="mx-1 mb-6 text-center text-font-description text-grey-1">
          <T
            id={descriptionI18nKey}
            substitutions={
              authState === 'success' ? <span className="text-font-description-bold">{email}</span> : undefined
            }
          />
        </p>

        {icon}
      </div>
    </PageModalScrollViewWithActions>
  );
});
