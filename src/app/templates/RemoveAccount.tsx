import * as React from "react";
import { useForm } from "react-hook-form";
import { navigate } from "lib/woozie";
import {
  TempleAccountType,
  useTempleClient,
  useRelevantAccounts,
  useAccount,
} from "lib/temple/front";
import { T, t } from "lib/i18n/react";
import AccountBanner from "app/templates/AccountBanner";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import Alert from "app/atoms/Alert";

const SUBMIT_ERROR_TYPE = "submit-error";

type FormData = {
  password: string;
};

const RemoveAccount: React.FC = () => {
  const { removeAccount } = useTempleClient();
  const allAccounts = useRelevantAccounts();
  const account = useAccount();

  const prevAccLengthRef = React.useRef(allAccounts.length);
  React.useEffect(() => {
    const accLength = allAccounts.length;
    if (prevAccLengthRef.current > accLength) {
      navigate("/");
    }
    prevAccLengthRef.current = accLength;
  }, [allAccounts]);

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
        await removeAccount(account.publicKeyHash, password);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

        // Human delay.
        await new Promise((res) => setTimeout(res, 300));
        setError("password", SUBMIT_ERROR_TYPE, err.message);
      }
    },
    [submitting, clearError, setError, removeAccount, account.publicKeyHash]
  );

  return (
    <div className="w-full max-w-sm p-2 mx-auto">
      <AccountBanner
        account={account}
        labelDescription={
          <>
            <T id="accountToBeRemoved" />
            <br />
            <T id="ifYouWantToRemoveAnotherAccount" />
          </>
        }
        className="mb-6"
      />

      {account.type === TempleAccountType.HD ? (
        <Alert
          title={t("cannotBeRemoved")}
          description={
            <p>
              <T id="accountsToRemoveConstraint" />
            </p>
          }
          className="my-4"
        />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormField
            ref={register({ required: t("required") })}
            label={t("password")}
            labelDescription={t("enterPasswordToRemoveAccount")}
            id="removeacc-secret-password"
            type="password"
            name="password"
            placeholder="********"
            errorCaption={errors.password?.message}
            containerClassName="mb-4"
          />

          <T id="remove">
            {(message) => (
              <FormSubmitButton loading={submitting} disabled={submitting}>
                {message}
              </FormSubmitButton>
            )}
          </T>
        </form>
      )}
    </div>
  );
};

export default RemoveAccount;
