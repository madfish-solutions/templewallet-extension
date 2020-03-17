import * as React from "react";
import { useForm } from "react-hook-form";

import Alert from "app/atoms/Alert";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";

type FormData = {
  secret: string;
};

const SUBMIT_ERROR_TYPE = "submit-error";

const ActivateAccount: React.FC = () => {
  const [success, setSuccess] = React.useState<React.ReactNode>(null);

  const {
    register,
    handleSubmit,
    formState,
    clearError,
    setError,
    errors
  } = useForm<FormData>();
  const { isSubmitting } = formState;

  const onSubmit = React.useCallback(
    async (data: FormData) => {
      if (isSubmitting) return;

      clearError("secret");
      setSuccess(null);
      try {
        const activateActionMock = (secret: string) =>
          new Promise(res => setTimeout(() => res(secret), 350));
        await activateActionMock(data.secret);
        // throw new Error("This secret key is not valid :(");

        setSuccess("You successfully activated your account");
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

        setError("secret", SUBMIT_ERROR_TYPE, err.message);
      }
    },
    [clearError, isSubmitting, setError]
  );

  return (
    <form
      className="w-full max-w-sm mx-auto p-2"
      onSubmit={handleSubmit(onSubmit)}
    >
      {success && (
        <Alert
          type="success"
          title="Success"
          description={success}
          className="mb-4"
        />
      )}
      <FormField
        name="secret"
        ref={register({ required: true })}
        containerClassName="mb-4"
        label="Secret"
        labelDescription="Wtf description"
        placeholder="e.g. n4hs7sd3..."
        errorCaption={errors.secret && errors.secret.message}
      />
      <FormSubmitButton loading={isSubmitting}>Activate</FormSubmitButton>
    </form>
  );
};

export default ActivateAccount;
