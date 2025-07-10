import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { OnSubmit, useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';

import { FormField, IconBase } from 'app/atoms';
import { StyledButton } from 'app/atoms/StyledButton';
import { TextButton } from 'app/atoms/TextButton';
import { ReactComponent as LockFillIcon } from 'app/icons/base/lock_fill.svg';
import { PlanetsBgPageLayout } from 'app/layouts/planets-bg-page-layout';
import { getUserTestingGroupNameActions } from 'app/store/ab-testing/actions';
import { useUserTestingGroupNameSelector } from 'app/store/ab-testing/selectors';
import { useShouldShowV2IntroModal } from 'app/templates/AppHeader/V2IntroductionModal/hooks/use-should-show-v2-intro-modal';
import { useFormAnalytics } from 'lib/analytics';
import { ABTestGroup } from 'lib/apis/temple';
import { DEFAULT_PASSWORD_INPUT_PLACEHOLDER } from 'lib/constants';
import { USER_ACTION_TIMEOUT } from 'lib/fixed-times';
import { T, t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { loadBackupCredentials } from 'lib/temple/front/mnemonic-to-backup-keeper';
import { TempleSharedStorageKey } from 'lib/temple/types';
import { useShakeOnErrorTrigger } from 'lib/ui/hooks/use-shake-on-error-trigger';
import { useLocalStorage } from 'lib/ui/local-storage';
import { delay } from 'lib/utils';

import { ForgotPasswordModal } from './forgot-password-modal';
import { ResetExtensionModal } from './reset-extension-modal';
import { UnlockSelectors } from './Unlock.selectors';

interface UnlockProps {
  canImportNew?: boolean;
}

interface FormData {
  password: string;
}

enum PageModalName {
  ForgotPassword = 'ForgotPassword',
  ResetExtension = 'ResetExtension'
}

const LOCK_TIME = 2 * USER_ACTION_TIMEOUT;
const LAST_ATTEMPT = 3;

const checkTime = (i: number) => (i < 10 ? '0' + i : i);

const getTimeLeft = (start: number, end: number) => {
  const isPositiveTime = start + end - Date.now() < 0 ? 0 : start + end - Date.now();
  const diff = isPositiveTime / 1000;
  const seconds = Math.floor(diff % 60);
  const minutes = Math.floor(diff / 60);
  return `${checkTime(minutes)}:${checkTime(seconds)}`;
};

const Unlock: FC<UnlockProps> = ({ canImportNew = true }) => {
  const { unlock } = useTempleClient();
  const dispatch = useDispatch();
  const formAnalytics = useFormAnalytics('UnlockWallet');

  useShouldShowV2IntroModal(true);

  const [pageModalName, setPageModalName] = useState<PageModalName | null>(null);
  const [attempt, setAttempt] = useLocalStorage<number>(TempleSharedStorageKey.PasswordAttempts, 1);
  const [timelock, setTimeLock] = useLocalStorage<number>(TempleSharedStorageKey.TimeLock, 0);
  const lockLevel = LOCK_TIME * Math.floor(attempt / 3);

  const [timeleft, setTimeleft] = useState(getTimeLeft(timelock, lockLevel));

  const testGroupName = useUserTestingGroupNameSelector();

  useEffect(() => {
    if (testGroupName === ABTestGroup.Unknown) {
      dispatch(getUserTestingGroupNameActions.submit());
    }
  }, [testGroupName]);

  const formRef = useRef<HTMLFormElement>(null);

  const focusPasswordField = useCallback(() => {
    formRef.current?.querySelector<HTMLInputElement>("input[name='password']")?.focus();
  }, []);

  const { register, handleSubmit, errors, setError, clearError, formState } = useForm<FormData>();
  const submitting = formState.isSubmitting;

  const passwordShakeTrigger = useShakeOnErrorTrigger(formState.submitCount, errors.password);

  const setPasswordErrorMessage = useCallback(
    async (message: string) => {
      // Human delay.
      await delay();

      setError('password', 'submit-error', message);
    },
    [setError]
  );

  const onSubmit = useCallback<OnSubmit<FormData>>(
    async ({ password }) => {
      if (submitting) return;

      clearError('password');
      formAnalytics.trackSubmit();
      try {
        if (attempt > LAST_ATTEMPT) await delay(Math.random() * 2000 + 1000);
        await unlock(password);
        await loadBackupCredentials(password);

        formAnalytics.trackSubmitSuccess();
        setAttempt(1);
      } catch (err: any) {
        formAnalytics.trackSubmitFail();

        console.error(err);

        if (attempt >= LAST_ATTEMPT) {
          setTimeLock(Date.now());
          await setPasswordErrorMessage(
            t(attempt === LAST_ATTEMPT ? 'walletTemporarilyBlockedError' : 'incorrectPasswordWalletBlockedError')
          );
        }

        setAttempt(attempt + 1);
        setTimeleft(getTimeLeft(Date.now(), LOCK_TIME * Math.floor((attempt + 1) / 3)));

        if (attempt < LAST_ATTEMPT) {
          await setPasswordErrorMessage(
            t('incorrectPasswordAttemptError', [String(LAST_ATTEMPT - attempt), String(LAST_ATTEMPT)])
          );
          focusPasswordField();
        }
      }
    },
    [
      submitting,
      clearError,
      formAnalytics,
      attempt,
      unlock,
      setAttempt,
      setPasswordErrorMessage,
      focusPasswordField,
      setTimeLock
    ]
  );

  const handleForgotPasswordClick = useCallback(() => setPageModalName(PageModalName.ForgotPassword), []);
  const handleModalClose = useCallback(() => setPageModalName(null), []);
  const handleForgotPasswordContinueClick = useCallback(() => setPageModalName(PageModalName.ResetExtension), []);

  const isDisabled = useMemo(() => Date.now() - timelock <= lockLevel, [timelock, lockLevel]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (timelock > 0 && Date.now() - timelock > lockLevel) {
        setTimeLock(0);
        clearError('password');
      }
      setTimeleft(getTimeLeft(timelock, lockLevel));
    }, 1_000);

    return () => {
      clearInterval(interval);
    };
  }, [timelock, lockLevel, setTimeLock, clearError]);

  return (
    <>
      <PlanetsBgPageLayout showTestnetModeIndicator={false}>
        <form ref={formRef} className="w-full flex flex-col items-center mb-4" onSubmit={handleSubmit(onSubmit)}>
          <p className="text-font-regular-bold text-center mb-0.5">
            <T id="welcomeBack" />
          </p>
          <p className="text-font-description text-center text-grey-1 mb-5">
            <T id="enterPasswordToUnlock" />
          </p>
          <div className="w-full flex-1 flex flex-col">
            <FormField
              ref={register({ required: t('required') })}
              id="unlock-password"
              type="password"
              name="password"
              placeholder={DEFAULT_PASSWORD_INPUT_PLACEHOLDER}
              errorCaption={errors.password && errors.password.message}
              shakeTrigger={passwordShakeTrigger}
              additionalActionButtons={isDisabled && <IconBase Icon={LockFillIcon} className="text-grey-3" />}
              revealForbidden={isDisabled}
              containerClassName="mb-3"
              autoFocus
              disabled={isDisabled}
              testID={UnlockSelectors.passwordInput}
            />

            <StyledButton
              color="primary"
              size="L"
              type="submit"
              disabled={isDisabled}
              loading={submitting}
              testID={UnlockSelectors.unlockButton}
            >
              {isDisabled ? timeleft : t('unlock')}
            </StyledButton>
          </div>
          {canImportNew && (
            <TextButton color="grey" onClick={handleForgotPasswordClick} className="mt-12">
              <T id="forgotPasswordQuestion" />
            </TextButton>
          )}
        </form>
      </PlanetsBgPageLayout>

      {pageModalName === PageModalName.ForgotPassword && (
        <ForgotPasswordModal onClose={handleModalClose} onContinueClick={handleForgotPasswordContinueClick} />
      )}
      {pageModalName === PageModalName.ResetExtension && <ResetExtensionModal onClose={handleModalClose} />}
    </>
  );
};

export default Unlock;
