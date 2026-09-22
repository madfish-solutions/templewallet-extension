import { FC, startTransition, useCallback, useEffect, useState } from 'react';

import { SubmitHandler, useForm } from 'react-hook-form';

import { FormField, IconBase } from 'app/atoms';
import { StyledButton } from 'app/atoms/StyledButton';
import { TextButton } from 'app/atoms/TextButton';
import { useSearchParamsBoolean } from 'app/hooks/use-search-params-boolean';
import { useShouldShowIntroModals } from 'app/hooks/use-should-show-v2-intro-modal';
import { ReactComponent as ChevronRightIcon } from 'app/icons/base/chevron_right.svg';
import { ReactComponent as LockFillIcon } from 'app/icons/base/lock_fill.svg';
import { PlanetsBgPageLayout } from 'app/layouts/planets-bg-page-layout';
import { dispatch } from 'app/store';
import { getUserTestingGroupNameActions } from 'app/store/ab-testing/actions';
import { useUserTestingGroupNameSelector } from 'app/store/ab-testing/selectors';
import { DoubleRewardsEngagementModal } from 'app/templates/DoubleRewardsEngagementModal';
import { FineTuneRewardsModal } from 'app/templates/FineTuneRewardsModal';
import { useFormAnalytics } from 'lib/analytics';
import { ABTestGroup } from 'lib/apis/temple';
import { DEFAULT_PASSWORD_INPUT_PLACEHOLDER, SHOULD_SHOW_FINE_TUNE_REWARDS_MODAL_STORAGE_KEY } from 'lib/constants';
import { USER_ACTION_TIMEOUT } from 'lib/fixed-times';
import { T, t } from 'lib/i18n';
import { useStorage, useTempleClient } from 'lib/temple/front';
import { loadBackupCredentials } from 'lib/temple/front/mnemonic-to-backup-keeper';
import { useInitToastParams } from 'lib/temple/front/toasts-context';
import { TempleSharedStorageKey } from 'lib/temple/types';
import { useShakeOnErrorTrigger } from 'lib/ui/hooks/use-shake-on-error-trigger';
import { useLocalStorage } from 'lib/ui/local-storage';
import { delay } from 'lib/utils';
import { Link } from 'lib/woozie';

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

const getTimeLeft = (start: number, end: number, now: number) => {
  const isPositiveTime = Math.max(start + end - now, 0);
  const diff = isPositiveTime / 1000;
  const seconds = Math.floor(diff % 60);
  const minutes = Math.floor(diff / 60);
  return `${checkTime(minutes)}:${checkTime(seconds)}`;
};

const Unlock: FC<UnlockProps> = ({ canImportNew = true }) => {
  const { unlock } = useTempleClient();
  const formAnalytics = useFormAnalytics('UnlockWallet');
  const [, setInitToastParams] = useInitToastParams();

  useShouldShowIntroModals(true);

  const [pageModalName, setPageModalName] = useState<PageModalName | null>(null);
  const { value: doubleRewardsEngagementModalOpen, setFalse: closeDoubleRewardsEngagementModal } =
    useSearchParamsBoolean('doubleRewardsEngagementModal');
  const [doubleRewardsEngagementModalHasBeenOpen] = useState(doubleRewardsEngagementModalOpen);
  const [initialShouldShowFineTuneRewardsModal, setInitialShouldShowFineTuneRewardsModal] = useStorage<boolean>(
    SHOULD_SHOW_FINE_TUNE_REWARDS_MODAL_STORAGE_KEY
  );

  const [shouldShowFineTuneRewardsModal, setShouldShowFineTuneRewardsModal] = useState(
    initialShouldShowFineTuneRewardsModal
  );
  useEffect(
    () =>
      startTransition(() =>
        setShouldShowFineTuneRewardsModal(prevValue => prevValue ?? initialShouldShowFineTuneRewardsModal)
      ),
    [initialShouldShowFineTuneRewardsModal]
  );
  const [attempt, setAttempt] = useLocalStorage<number>(TempleSharedStorageKey.PasswordAttempts, 1);
  const [timelock, setTimeLock] = useLocalStorage<number>(TempleSharedStorageKey.TimeLock, 0);
  const lockLevel = LOCK_TIME * Math.floor(attempt / 3);

  const [timeleft, setTimeleft] = useState('00:00');
  const [isDisabled, setIsDisabled] = useState(timelock > 0 && lockLevel > 0);

  const testGroupName = useUserTestingGroupNameSelector();

  useEffect(() => {
    if (testGroupName === ABTestGroup.Unknown) {
      dispatch(getUserTestingGroupNameActions.submit());
    }
  }, [testGroupName]);

  const { register, handleSubmit, setError, clearErrors, setFocus, formState } = useForm<FormData>();
  const { errors, isSubmitting: submitting } = formState;

  const passwordShakeTrigger = useShakeOnErrorTrigger(formState.submitCount, errors.password);

  const setPasswordErrorMessage = async (message: string) => {
    // Human delay.
    await delay();

    setError('password', { type: 'submit-error', message });
  };

  const handleFineTuneRewardsModalClose = () => {
    setShouldShowFineTuneRewardsModal(false);
    setInitToastParams({
      title: 'You’re earning rewards from Promo',
      textBold: true,
      txDataOrLink: (
        <Link
          to="/settings/additional-settings"
          className="flex items-center px-1 py-0.5 text-secondary text-font-num-12 font-semibold"
        >
          <T id="settings" />
          <IconBase Icon={ChevronRightIcon} size={12} className="text-secondary" />
        </Link>
      )
    });
  };

  const handleFineTuneRewardsModalShown = () => setInitialShouldShowFineTuneRewardsModal(false);

  const onSubmit = useCallback<SubmitHandler<FormData>>(
    async ({ password }) => {
      if (submitting) return;

      clearErrors('password');
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

        const currentTime = Date.now();

        if (attempt >= LAST_ATTEMPT) {
          setTimeLock(currentTime);
          setIsDisabled(true);
          await setPasswordErrorMessage(
            t(attempt === LAST_ATTEMPT ? 'walletTemporarilyBlockedError' : 'incorrectPasswordWalletBlockedError')
          );
        }

        setAttempt(value => value + 1);
        setTimeleft(getTimeLeft(currentTime, LOCK_TIME * Math.floor((attempt + 1) / 3), currentTime));
        setIsDisabled(attempt >= LAST_ATTEMPT);

        if (attempt < LAST_ATTEMPT) {
          await setPasswordErrorMessage(
            t('incorrectPasswordAttemptError', [String(LAST_ATTEMPT - attempt), String(LAST_ATTEMPT)])
          );
          setFocus('password');
        }
      }
    },
    [
      submitting,
      clearErrors,
      formAnalytics,
      attempt,
      unlock,
      setAttempt,
      setPasswordErrorMessage,
      setFocus,
      setTimeLock
    ]
  );

  const handleForgotPasswordClick = () => setPageModalName(PageModalName.ForgotPassword);
  const handleModalClose = () => setPageModalName(null);
  const handleForgotPasswordContinueClick = () => setPageModalName(PageModalName.ResetExtension);

  useEffect(() => {
    const updateLockState = () => {
      const currentTime = Date.now();
      const lockExpired = timelock > 0 && currentTime - timelock > lockLevel;

      if (lockExpired) {
        setTimeLock(0);
        clearErrors('password');
      }

      setIsDisabled(timelock > 0 && !lockExpired && currentTime - timelock <= lockLevel);
      setTimeleft(getTimeLeft(timelock, lockLevel, currentTime));
    };

    updateLockState();

    const interval = setInterval(updateLockState, 1_000);

    return () => {
      clearInterval(interval);
    };
  }, [timelock, lockLevel, setTimeLock, clearErrors]);

  return (
    <>
      <PlanetsBgPageLayout showTestnetModeIndicator={false}>
        <form className="w-full flex flex-col items-center mb-4" onSubmit={handleSubmit(onSubmit)}>
          <p className="text-font-regular-bold text-center mb-0.5">
            <T id="welcomeBack" />
          </p>
          <p className="text-font-description text-center text-grey-1 mb-5">
            <T id="enterPasswordToUnlock" />
          </p>
          <div className="w-full flex-1 flex flex-col">
            <FormField
              {...register('password', { required: t('required') })}
              id="unlock-password"
              type="password"
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
      <DoubleRewardsEngagementModal
        opened={doubleRewardsEngagementModalOpen}
        onRequestClose={closeDoubleRewardsEngagementModal}
      />
      <FineTuneRewardsModal
        opened={!!shouldShowFineTuneRewardsModal && !doubleRewardsEngagementModalHasBeenOpen}
        onClose={handleFineTuneRewardsModalClose}
        onShown={handleFineTuneRewardsModalShown}
      />
    </>
  );
};

export default Unlock;
