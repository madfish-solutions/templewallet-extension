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
  illustrationState: GoogleIllustrationState;
}

type AuthStateType = 'pending' | 'success' | 'popupError' | 'otherError';

interface AuthStateBase {
  type: AuthStateType;
}

interface AuthStateSuccess extends AuthStateBase {
  type: 'success';
  email: string;
}

interface OtherAuthState extends AuthStateBase {
  type: Exclude<AuthStateType, 'success'>;
}

type AuthState = AuthStateSuccess | OtherAuthState;

const stateRenderParams: Record<AuthStateType, StateRenderParams> = {
  pending: {
    titleI18nKey: 'signInWithGoogle',
    descriptionI18nKey: 'signInWithGoogleToCreateWalletDescription',
    icon: <Loader size="L" trackVariant="dark" className="text-secondary" />,
    illustrationState: 'active'
  },
  success: {
    titleI18nKey: 'accountConnected',
    descriptionI18nKey: 'accountConnectedDescription',
    icon: <IconBase Icon={OkFillIcon} size={24} className="text-success" />,
    illustrationState: 'success'
  },
  popupError: {
    titleI18nKey: 'couldNotConnect',
    descriptionI18nKey: 'authPopupErrorDescription',
    icon: <IconBase Icon={XCircleFillIcon} size={24} className="text-error" />,
    illustrationState: 'error'
  },
  otherError: {
    titleI18nKey: 'couldNotConnect',
    descriptionI18nKey: 'couldNotConnectGoogleAccountDescription',
    icon: <IconBase Icon={XCircleFillIcon} size={24} className="text-error" />,
    illustrationState: 'error'
  }
};

interface GoogleAuthProps {
  next: (googleAuthToken: string) => void | Promise<void>;
}

export const GoogleAuth = memo<GoogleAuthProps>(({ next }) => {
  const { googleAuthToken, setGoogleAuthToken } = useTempleClient();
  const [authState, setAuthState] = useState<AuthState>({ type: 'pending' });
  const isAuthError = authState.type === 'popupError' || authState.type === 'otherError';
  const googleAuthIframeRef = useRef<HTMLIFrameElement>(null);
  const { titleI18nKey, descriptionI18nKey, icon, illustrationState } = stateRenderParams[authState.type];

  const googleAuthPageUrl = useMemo(() => getGoogleAuthPageUrl(), []);

  const handleGoogleAuthToken = useCallback(async (authToken: string) => {
    try {
      setAuthState({ type: 'success', email: await getAccountEmail(authToken) });
    } catch (e) {
      console.error(e);
      setAuthState({ type: 'otherError' });
    }
  }, []);

  const refreshGoogleAuthToken = useCallback(
    (isRetry: boolean) => {
      setGoogleAuthToken(undefined);
      getGoogleAuthToken(googleAuthIframeRef, isRetry)
        .then(setGoogleAuthToken)
        .catch(e => {
          console.error(e);
          setAuthState({ type: e.message === 'popup_failed_to_open' ? 'popupError' : 'otherError' });
        });
    },
    [setGoogleAuthToken]
  );

  const retry = useCallback(() => {
    setAuthState({ type: 'pending' });

    if (googleAuthToken) {
      handleGoogleAuthToken(googleAuthToken);
    } else {
      refreshGoogleAuthToken(true);
    }
  }, [googleAuthToken, handleGoogleAuthToken, refreshGoogleAuthToken]);

  const isFirstMountRef = useRef(true);
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      refreshGoogleAuthToken(false);
    } else if (googleAuthToken) {
      handleGoogleAuthToken(googleAuthToken);
    }
  }, [googleAuthToken, handleGoogleAuthToken, refreshGoogleAuthToken]);

  const [isLoading, setIsLoading] = useState(false);
  const onContinueClick = useCallback(async () => {
    if (!googleAuthToken) {
      return;
    }

    try {
      setIsLoading(true);
      await next(googleAuthToken!);
    } catch (e) {
      console.error(e);
      toastError(serializeError(e) ?? t('unknownError'));
    } finally {
      setIsLoading(false);
    }
  }, [googleAuthToken, next]);

  const descriptionSubstitutions = useMemo(() => {
    switch (authState.type) {
      case 'success':
        return <span className="text-font-description-bold">{authState.email}</span>;
      case 'popupError':
        return window.location.hostname;
      default:
        return undefined;
    }
  }, [authState]);

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
            disabled={authState.type === 'pending'}
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
        <GoogleIllustration className="w-full h-auto" state={illustrationState} />
      </div>

      <div className="flex flex-col items-center mb-4">
        <p className="mb-2 text-center text-font-regular-bold">
          <T id={titleI18nKey} />
        </p>

        <p className="mx-1 mb-6 text-center text-font-description text-grey-1">
          <T id={descriptionI18nKey} substitutions={descriptionSubstitutions} />
        </p>

        {icon}
      </div>
    </PageModalScrollViewWithActions>
  );
});
