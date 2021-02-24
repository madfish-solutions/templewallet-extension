import * as React from "react";
import classNames from "clsx";
import { useForm } from "react-hook-form";
import { Link } from "lib/woozie";
import { T, t } from "lib/i18n/react";
import { useTempleClient } from "lib/temple/front";
import SimplePageLayout from "app/layouts/SimplePageLayout";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";

interface UnlockProps {
  canImportNew?: boolean;
}

type FormData = {
  password: string;
};

const SUBMIT_ERROR_TYPE = "submit-error";

const Unlock: React.FC<UnlockProps> = ({ canImportNew = true }) => {
  const { unlock } = useTempleClient();

  const formRef = React.useRef<HTMLFormElement>(null);

  const focusPasswordField = React.useCallback(() => {
    formRef.current
      ?.querySelector<HTMLInputElement>("input[name='password']")
      ?.focus();
  }, []);

  const {
    register,
    handleSubmit,
    errors,
    setError,
    clearError,
    formState,
  } = useForm<FormData>();
  const submitting = formState.isSubmitting;

  const onSubmit = React.useCallback(
    async ({ password }) => {
      if (submitting) return;

      clearError("password");
      try {
        await unlock(password);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

        // Human delay.
        await new Promise((res) => setTimeout(res, 300));
        setError("password", SUBMIT_ERROR_TYPE, err.message);
        focusPasswordField();
      }
    },
    [submitting, clearError, setError, unlock, focusPasswordField]
  );

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
        />

        <FormSubmitButton loading={submitting}>{t("unlock")}</FormSubmitButton>

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
