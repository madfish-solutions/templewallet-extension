import * as React from "react";
import classNames from "clsx";
import { useForm } from "react-hook-form";
import { navigate } from "lib/woozie";
import { useThanosFrontContext } from "lib/thanos/front";
import ContentContainer from "app/layouts/ContentContainer";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import FormSecondaryButton from "app/atoms/FormSecondaryButton";

type FormData = {
  password: string;
};

const SUBMIT_ERROR_TYPE = "submit-error";

const Unlock: React.FC = () => {
  const { unlock } = useThanosFrontContext();

  const {
    register,
    handleSubmit,
    errors,
    setError,
    clearError,
    formState
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
        await new Promise(res => setTimeout(res, 300));
        setError("password", SUBMIT_ERROR_TYPE, err.message);
      }
    },
    [submitting, clearError, setError, unlock]
  );

  const handleImportAnotherClick = React.useCallback(() => {
    navigate("/import-wallet");
  }, []);

  return (
    <ContentContainer
      className={classNames(
        "min-h-screen",
        "flex flex-col items-center justify-center"
      )}
    >
      <h1 className="my-4 text-4xl text-gray-700 font-light">Unlock Wallet</h1>

      {/* <div
        className={classNames(
          "w-full mx-auto max-w-md",
          "bg-white",
          "rounded-md shadow-md",
          "px-4"
        )}
      > */}
      <form
        className="my-8 w-full mx-auto max-w-sm"
        onSubmit={handleSubmit(onSubmit)}
      >
        <FormField
          ref={register({ required: "Required." })}
          label="Password"
          labelDescription="A password is used to protect the wallet."
          id="unlock-password"
          type="password"
          name="password"
          placeholder="********"
          errorCaption={errors.password && errors.password.message}
          containerClassName="mb-6"
          autoFocus
        />

        <div className="flex items-stretch">
          <FormSubmitButton loading={submitting}>Unlock</FormSubmitButton>

          <div className="flex-1" />

          <FormSecondaryButton
            disabled={submitting}
            onClick={handleImportAnotherClick}
          >
            Import another
          </FormSecondaryButton>
        </div>
      </form>
      {/* </div> */}
    </ContentContainer>
  );
};

export default Unlock;
