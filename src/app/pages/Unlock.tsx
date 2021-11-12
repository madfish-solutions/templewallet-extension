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
const FIVE_MINS = 5 * 60_000

const Unlock: FC<UnlockProps> = ({ canImportNew = true }) => {
  const { unlock } = useTempleClient();
  const formAnalytics = useFormAnalytics("UnlockWallet");

  const [attempt, addAtttempt] = useLocalStorage<number>(TempleSharedStorageKey.PasswordAttempts, 0);
  const [disabled, setDisabled] = useLocalStorage<number>(TempleSharedStorageKey.DisabledTimeLeft, 0);

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
        if (attempt > 2) await new Promise((res) => setTimeout(res, Math.random() * 2000 + 1000));
        await unlock(password);

        formAnalytics.trackSubmitSuccess();
        addAtttempt(0);
      } catch (err: any) {
        formAnalytics.trackSubmitFail();
        addAtttempt(attempt + 1);

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
      addAtttempt
    ]
  );

  useEffect(() => {
    if (attempt > 2 && !disabled) {
      setDisabled(Date.now());
    }
  }, [attempt, disabled, setDisabled])
  
  const isDisabled = useMemo(() => Date.now() - disabled <= FIVE_MINS, [disabled])

  useEffect(() => {
    const interval = setInterval(() => {
      if(Date.now() - disabled > FIVE_MINS) {
        setDisabled(0)
        addAtttempt(2)
      }
    }, 5_000);

    return () => {
      clearInterval(interval);
    };
  }, [disabled, attempt, setDisabled, addAtttempt]);

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
