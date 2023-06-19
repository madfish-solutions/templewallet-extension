import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import classNames from 'clsx';
import { OnSubmit, useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';

import { Alert, FormField, FormSubmitButton } from 'app/atoms';
import SimplePageLayout from 'app/layouts/SimplePageLayout';
import { useFormAnalytics } from 'lib/analytics';
import { USER_ACTION_TIMEOUT } from 'lib/fixed-times';
import { T, t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { TempleSharedStorageKey } from 'lib/temple/types';
import { useLocalStorage } from 'lib/ui/local-storage';
import { Link } from 'lib/woozie';

import { ABTestGroup } from '../../../lib/apis/temple';
import { getUserTestingGroupNameActions } from '../../store/ab-testing/actions';
import { useUserTestingGroupNameSelector } from '../../store/ab-testing/selectors';
import { UnlockSelectors } from './Unlock.selectors';

interface UnlockProps {
  canImportNew?: boolean;
}

type FormData = {
  password: string;
};

const SUBMIT_ERROR_TYPE = 'submit-error';
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

  const onSubmit = useCallback<OnSubmit<FormData>>(
    async ({ password }) => {
      if (submitting) return;

      clearError('password');
      formAnalytics.trackSubmit();
      try {
        if (attempt > LAST_ATTEMPT) await new Promise(res => setTimeout(res, Math.random() * 2000 + 1000));
        await unlock(password);

        formAnalytics.trackSubmitSuccess();
        setAttempt(1);
      } catch (err: any) {
        formAnalytics.trackSubmitFail();
        if (attempt >= LAST_ATTEMPT) setTimeLock(Date.now());
        setAttempt(attempt + 1);
        setTimeleft(getTimeLeft(Date.now(), LOCK_TIME * Math.floor((attempt + 1) / 3)));

        console.error(err);

        // Human delay.
        await new Promise(res => setTimeout(res, 300));
        setError('password', SUBMIT_ERROR_TYPE, err.message);
        focusPasswordField();
      }
    },
    [submitting, clearError, setError, unlock, focusPasswordField, formAnalytics, attempt, setAttempt, setTimeLock]
  );

  const isDisabled = useMemo(() => Date.now() - timelock <= lockLevel, [timelock, lockLevel]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - timelock > lockLevel) {
        setTimeLock(0);
      }
      setTimeleft(getTimeLeft(timelock, lockLevel));
    }, 1_000);

    return () => {
      clearInterval(interval);
    };
  }, [timelock, lockLevel, setTimeLock]);

  return (
    <SimplePageLayout
      title={
        <>
          <T id="unlockWallet" />
          <br />
          <span style={{ fontSize: '0.9em' }}>
            <T id="toContinue" />
          </span>
        </>
      }
    >
      {isDisabled && (
        <Alert
          type="error"
          title={t('error')}
          description={`${t('unlockPasswordErrorDelay')} ${timeleft}`}
          className="mt-6"
        />
      )}
      <form ref={formRef} className="w-full max-w-sm mx-auto my-8" onSubmit={handleSubmit(onSubmit)}>
        <FormField
          ref={register({ required: t('required') })}
          label={t('password')}
          labelDescription={t('unlockPasswordInputDescription')}
          id="unlock-password"
          type="password"
          name="password"
          placeholder="********"
          errorCaption={errors.password && errors.password.message}
          containerClassName="mb-4"
          autoFocus
          disabled={isDisabled}
          testID={UnlockSelectors.passwordInput}
        />

        <FormSubmitButton disabled={isDisabled} loading={submitting} testID={UnlockSelectors.unlockButton}>
          {t('unlock')}
        </FormSubmitButton>

        {canImportNew && (
          <div className="my-6">
            <h3 className="text-sm font-light text-gray-600">
              <T id="importNewAccountTitle" />
            </h3>

            <Link
              to="/import-wallet"
              className={classNames(
                'text-primary-orange',
                'text-sm font-semibold',
                'transition duration-200 ease-in-out',
                'opacity-75 hover:opacity-100 focus:opacity-100',
                'hover:underline'
              )}
              testID={UnlockSelectors.importWalletUsingSeedPhrase}
            >
              <T id="importWalletUsingSeedPhrase" />
            </Link>
          </div>
        )}
      </form>
    </SimplePageLayout>
  );
};

export default Unlock;
