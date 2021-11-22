import React, { FC, useCallback, useEffect, useMemo, useRef } from "react";

import classNames from "clsx";
import { useForm } from "react-hook-form";

import Alert from "app/atoms/Alert";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import SimplePageLayout from "app/layouts/SimplePageLayout";
import { useFormAnalytics } from "lib/analytics";
import { T, t } from "lib/i18n/react";
import { useLocalStorage, useTempleClient, TempleSharedStorageKey } from "lib/temple/front";
import { Link } from "lib/woozie";

interface UnlockProps {
  canImportNew?: boolean;
}

type FormData = {
  password: string;
};

const SUBMIT_ERROR_TYPE = "submit-error";
const LOCK_TIME = 5 * 60_000;
const LAST_ATTEMPT = 3;

const Unlock: FC<UnlockProps> = ({ canImportNew = true }) => {
  const { unlock } = useTempleClient();
  const formAnalytics = useFormAnalytics("UnlockWallet");

  const [attempt, setAttempt] = useLocalStorage<number>(TempleSharedStorageKey.PasswordAttempts, 1);
  const [timelock, setTimeLock] = useLocalStorage<number>(TempleSharedStorageKey.TimeLock, 0);

  const formRef = useRef<HTMLFormElement>(null);

  const focusPasswordField = useCallback(() => {
    formRef.current
      ?.querySelector<HTMLInputElement>("input[name='password']")
      ?.focus();
  }, []);

  const { register, handleSubmit, errors, setError, clearError, formState } =
    useForm<FormData>();
  const submitting = formState.isSubmitting;

  const onSubmit = useCallback(
    async ({ password }) => {
      if (submitting) return;

      clearError("password");
      formAnalytics.trackSubmit();
      try {
        if (attempt > LAST_ATTEMPT) await new Promise((res) => setTimeout(res, Math.random() * 2000 + 1000));
        await unlock(password);

        formAnalytics.trackSubmitSuccess();
        setAttempt(1);
      } catch (err: any) {
        formAnalytics.trackSubmitFail();
        setAttempt(attempt + 1);

        console.error(err);

        // Human delay.
        await new Promise((res) => setTimeout(res, 300));
        setError("password", SUBMIT_ERROR_TYPE, err.message);
        focusPasswordField();
      }
    },
    [
      submitting,
      clearError,
      setError,
      unlock,
      focusPasswordField,
      formAnalytics,
      attempt,
      setAttempt
    ]
  );

  useEffect(() => {
    if (attempt > LAST_ATTEMPT && !timelock) {
      setTimeLock(Date.now());
    }
  }, [attempt, timelock, setTimeLock])

  const isDisabled = useMemo(() => Date.now() - timelock <= LOCK_TIME, [timelock])

  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - timelock > LOCK_TIME) {
        setTimeLock(0)
        setAttempt(LAST_ATTEMPT)
      }
    }, 5_000);

    return () => {
      clearInterval(interval);
    };
  }, [timelock, attempt, setTimeLock, setAttempt]);

  return (
    <SimplePageLayout
      title={
        <>
          <T id="unlockWallet" />
          <br />
          <T id="toContinue">
            {(message) => <span style={{ fontSize: "0.9em" }}>{message}</span>}
          </T>
        </>
      }
    >
      {isDisabled && (
        <Alert
          type="error"
          title={t("error")}
          description={t('unlockPasswordErrorDelay')}
          className="mt-6"
        />
      )}
      <form
        ref={formRef}
        className="w-full max-w-sm mx-auto my-8"
        onSubmit={handleSubmit(onSubmit)}
      >
        <FormField
          ref={register({ required: t("required") })}
          label={t("password")}
          labelDescription={t("unlockPasswordInputDescription")}
          id="unlock-password"
          type="password"
          name="password"
          placeholder="********"
          errorCaption={errors.password && errors.password.message}
          containerClassName="mb-4"
          autoFocus
          disabled={isDisabled}
        />

        <FormSubmitButton disabled={isDisabled} loading={submitting}>{t("unlock")}</FormSubmitButton>

        {canImportNew && (
          <div className="my-6">
            <T id="importNewAccountTitle">
              {(message) => (
                <h3 className="text-sm font-light text-gray-600">{message}</h3>
              )}
            </T>

            <T id="importWalletUsingSeedPhrase">
              {(message) => (
                <Link
                  to="/import-wallet"
                  className={classNames(
                    "text-primary-orange",
                    "text-sm font-semibold",
                    "transition duration-200 ease-in-out",
                    "opacity-75 hover:opacity-100 focus:opacity-100",
                    "hover:underline"
                  )}
                >
                  {message}
                </Link>
              )}
            </T>
          </div>
        )}
      </form>
    </SimplePageLayout>
  );
};

export default Unlock;
