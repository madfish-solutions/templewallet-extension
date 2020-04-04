import * as React from "react";
import { useForm } from "react-hook-form";
import { navigate } from "lib/woozie";
import { useThanosClient, useReadyThanos } from "lib/thanos/front";
import PageLayout from "app/layouts/PageLayout";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import { ReactComponent as AddIcon } from "app/icons/add.svg";

type FormData = {
  password: string;
};

const SUBMIT_ERROR_TYPE = "submit-error";

const CreateAccount: React.FC = () => {
  const { createAccount } = useThanosClient();
  const { allAccounts, setAccountPkh } = useReadyThanos();

  const prevAccLengthRef = React.useRef(allAccounts.length);
  React.useEffect(() => {
    const accLength = allAccounts.length;
    if (prevAccLengthRef.current < accLength) {
      setAccountPkh(allAccounts[accLength - 1].publicKeyHash);
      navigate("/");
    }
    prevAccLengthRef.current = accLength;
  }, [allAccounts, setAccountPkh]);

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
        await createAccount(password);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

        // Human delay.
        await new Promise(res => setTimeout(res, 300));
        setError("password", SUBMIT_ERROR_TYPE, err.message);
      }
    },
    [submitting, clearError, setError, createAccount]
  );

  return (
    <PageLayout
      pageTitle={
        <>
          <AddIcon className="mr-1 h-4 w-auto stroke-current" />
          Create Account
        </>
      }
    >
      <div className="mt-6 w-full max-w-sm mx-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormField
            ref={register({ required: "Required" })}
            label="Password"
            labelDescription={`Enter password to create new Account.`}
            id="create-account-password"
            type="password"
            name="password"
            placeholder="********"
            errorCaption={errors.password?.message}
            containerClassName="mb-4"
          />

          <FormSubmitButton loading={submitting} disabled={submitting}>
            Create Account
          </FormSubmitButton>
        </form>
      </div>
    </PageLayout>
  );
};

export default CreateAccount;
