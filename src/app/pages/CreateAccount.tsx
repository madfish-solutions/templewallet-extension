import * as React from "react";
import { useForm } from "react-hook-form";
import { navigate } from "lib/woozie";
import {
  TempleAccountType,
  useTempleClient,
  useAllAccounts,
  useSetAccountPkh,
} from "lib/temple/front";
import { T, t } from "lib/i18n/react";
import PageLayout from "app/layouts/PageLayout";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import { ReactComponent as AddIcon } from "app/icons/add.svg";

type FormData = {
  name: string;
};

const SUBMIT_ERROR_TYPE = "submit-error";

const CreateAccount: React.FC = () => {
  const { createAccount } = useTempleClient();
  const allAccounts = useAllAccounts();
  const setAccountPkh = useSetAccountPkh();

  const allHDOrImported = React.useMemo(
    () =>
      allAccounts.filter((acc) =>
        [TempleAccountType.HD, TempleAccountType.Imported].includes(acc.type)
      ),
    [allAccounts]
  );

  const defaultName = React.useMemo(
    () => t("defaultAccountName", String(allHDOrImported.length + 1)),
    [allHDOrImported.length]
  );

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
          <T id="createAccount" />
        </>
      }
    >
      <div className="w-full max-w-sm mx-auto mt-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormField
            ref={register({
              pattern: {
                value: /^[a-zA-Z0-9 _-]{0,16}$/,
                message: t("accountNameInputTitle"),
              },
            })}
            label={t("accountName")}
            labelDescription={t("accountNameInputDescription")}
            id="create-account-name"
            type="text"
            name="name"
            placeholder={defaultName}
            errorCaption={errors.name?.message}
            containerClassName="mb-4"
          />

          <T id="createAccount">
            {(message) => (
              <FormSubmitButton className="capitalize" loading={submitting}>
                {message}
              </FormSubmitButton>
            )}
          </T>
        </form>
      </div>
    </PageLayout>
  );
};

export default CreateAccount;
