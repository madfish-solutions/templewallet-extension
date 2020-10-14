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
import { T, useTranslation } from "lib/ui/i18n";
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
  const { t } = useTranslation();

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
            <T id="accountToBeRemoved">{(message) => <>{message}</>}</T>
            <br />
            <T id="ifYouWantToRemoveAnotherAccount">
              {(message) => <>{message}</>}
            </T>
          </>
        }
        className="mb-6"
      />

      {account.type === ThanosAccountType.HD ? (
        <Alert
          title={t("cannotBeRemoved")}
          description={
            <T
              id="accountsToRemoveConstraint"
              substitutions={[
                <T key="imported" id="importedPlural">
                  {(message) => (
                    <span
                      className={classNames(
                        "rounded-sm",
                        "border",
                        "px-1 py-px",
                        "font-normal leading-tight"
                      )}
                      style={{
                        fontSize: "0.75em",
                        borderColor: "currentColor",
                      }}
                    >
                      {message}
                    </span>
                  )}
                </T>,
                <T key="ledger" id="ledger">
                  {(message) => (
                    <span
                      className={classNames(
                        "rounded-sm",
                        "border",
                        "px-1 py-px",
                        "font-normal leading-tight"
                      )}
                      style={{
                        fontSize: "0.75em",
                        borderColor: "currentColor",
                      }}
                    >
                      {message}
                    </span>
                  )}
                </T>,
              ]}
            >
              {(message) => <p>{message}</p>}
            </T>
          }
          className="my-4"
        />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormField
            ref={register({ required: "Required" })}
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
