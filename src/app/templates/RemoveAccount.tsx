import * as React from "react";
import classNames from "clsx";
import { useForm } from "react-hook-form";
import { navigate } from "lib/woozie";
import {
  ThanosAccountType,
  useThanosClient,
  useAllAccounts,
  useAccount,
} from "lib/thanos/front";
import AccountBanner from "app/templates/AccountBanner";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import Alert from "app/atoms/Alert";

const SUBMIT_ERROR_TYPE = "submit-error";

type FormData = {
  password: string;
};

const RemoveAccount: React.FC = () => {
  const { removeAccount } = useThanosClient();
  const allAccounts = useAllAccounts();
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
            Account to be removed. <br />
            If you want to remove another account - select it in the top-right
            dropdown.
          </>
        }
        className="mb-6"
      />

      {account.type === ThanosAccountType.HD ? (
        <Alert
          title="Cannot be removed"
          description={
            <p>
              Only{" "}
              <span
                className={classNames(
                  "rounded-sm",
                  "border",
                  "px-1 py-px",
                  "font-normal leading-tight"
                )}
                style={{ fontSize: "0.75em", borderColor: "currentColor" }}
              >
                Imported
              </span>{" "}
              or{" "}
              <span
                className={classNames(
                  "rounded-sm",
                  "border",
                  "px-1 py-px",
                  "font-normal leading-tight"
                )}
                style={{ fontSize: "0.75em", borderColor: "currentColor" }}
              >
                Ledger
              </span>{" "}
              accounts can be removed.
            </p>
          }
          className="my-4"
        />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormField
            ref={register({ required: "Required" })}
            label="Password"
            labelDescription={`Enter password to remove the Account.`}
            id="removeacc-secret-password"
            type="password"
            name="password"
            placeholder="********"
            errorCaption={errors.password?.message}
            containerClassName="mb-4"
          />

          <FormSubmitButton loading={submitting} disabled={submitting}>
            Remove
          </FormSubmitButton>
        </form>
      )}
    </div>
  );
};

export default RemoveAccount;
