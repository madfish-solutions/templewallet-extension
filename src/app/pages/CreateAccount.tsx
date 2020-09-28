import * as React from "react";
import { useForm } from "react-hook-form";
import { navigate } from "lib/woozie";
import {
  useThanosClient,
  useAllAccounts,
  useSetAccountPkh,
} from "lib/thanos/front";
import { T } from "lib/ui/i18n";
import PageLayout from "app/layouts/PageLayout";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import { ReactComponent as AddIcon } from "app/icons/add.svg";

type FormData = {
  name: string;
};

const SUBMIT_ERROR_TYPE = "submit-error";

const CreateAccount: React.FC = () => {
  const { createAccount } = useThanosClient();
  const allAccounts = useAllAccounts();
  const setAccountPkh = useSetAccountPkh();

  const defaultName = React.useMemo(() => `Account ${allAccounts.length + 1}`, [
    allAccounts.length,
  ]);

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
    formState,
  } = useForm<FormData>({ defaultValues: { name: defaultName } });
  const submitting = formState.isSubmitting;

  const onSubmit = React.useCallback(
    async ({ name }) => {
      if (submitting) return;

      clearError("name");
      try {
        await createAccount(name);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

        // Human delay.
        await new Promise((res) => setTimeout(res, 300));
        setError("name", SUBMIT_ERROR_TYPE, err.message);
      }
    },
    [submitting, clearError, setError, createAccount]
  );

  return (
    <PageLayout
      pageTitle={
        <>
          <AddIcon className="w-auto h-4 mr-1 stroke-current" />
          <T name="createAccount" />
        </>
      }
    >
      <div className="w-full max-w-sm mx-auto mt-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormField
            ref={register({
              pattern: {
                value: /^[a-zA-Z0-9 _-]{0,16}$/,
                message: "1-16 characters, no special",
              },
            })}
            label="Account name"
            labelDescription={`What will be the name of the new account?`}
            id="create-account-name"
            type="text"
            name="name"
            placeholder={defaultName}
            errorCaption={errors.name?.message}
            containerClassName="mb-4"
          />

          <FormSubmitButton loading={submitting}>
            Create Account
          </FormSubmitButton>
        </form>
      </div>
    </PageLayout>
  );
};

export default CreateAccount;
