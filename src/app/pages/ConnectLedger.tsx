import * as React from "react";
import classNames from "clsx";
import { useForm } from "react-hook-form";
import { navigate } from "lib/woozie";
import {
  useTempleClient,
  useSetAccountPkh,
  useAllAccounts,
  TempleAccountType,
  validateDerivationPath,
} from "lib/temple/front";
import { T, t } from "lib/i18n/react";
import PageLayout from "app/layouts/PageLayout";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import FormField from "app/atoms/FormField";
import Alert from "app/atoms/Alert";
import { ReactComponent as LinkIcon } from "app/icons/link.svg";
import { ReactComponent as OkIcon } from "app/icons/ok.svg";
import ConfirmLedgerOverlay from "app/atoms/ConfirmLedgerOverlay";

type FormData = {
  name: string;
  customDerivationPath: string;
  accountNumber?: number;
};

const DERIVATION_PATHS = [
  {
    type: "default",
    name: t("defaultAccount"),
  },
  {
    type: "another",
    name: t("anotherAccount"),
  },
  {
    type: "custom",
    name: t("customDerivationPath"),
  },
];

const ConnectLedger: React.FC = () => {
  const { createLedgerAccount } = useTempleClient();
  const allAccounts = useAllAccounts();
  const setAccountPkh = useSetAccountPkh();

  const allLedgers = React.useMemo(
    () => allAccounts.filter((acc) => acc.type === TempleAccountType.Ledger),
    [allAccounts]
  );

  const defaultName = React.useMemo(
    () => t("defaultLedgerName", String(allLedgers.length + 1)),
    [allLedgers.length]
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

  const { register, handleSubmit, errors, formState } = useForm<FormData>({
    defaultValues: {
      name: defaultName,
      customDerivationPath: "m/44'/1729'/0'/0'",
      accountNumber: 1,
    },
  });
  const submitting = formState.isSubmitting;

  const [error, setError] = React.useState<React.ReactNode>(null);
  const [derivationPath, setDerivationPath] = React.useState(
    DERIVATION_PATHS[0]
  );

  const onSubmit = React.useCallback(
    async ({ name, accountNumber, customDerivationPath }: FormData) => {
      if (submitting) return;
      setError(null);

      try {
        await createLedgerAccount(
          name,
          customDerivationPath ??
            (accountNumber && `m/44'/1729'/${accountNumber - 1}'/0'`)
        );
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

        // Human delay.
        await new Promise((res) => setTimeout(res, 300));
        setError(err.message);
      }
    },
    [submitting, createLedgerAccount, setError]
  );

  return (
    <PageLayout
      pageTitle={
        <T id="connectLedger">
          {(message) => (
            <>
              <LinkIcon className="w-auto h-4 mr-1 stroke-current" />
              {message}
            </>
          )}
        </T>
      }
    >
      <div className="relative w-full">
        <div className="w-full max-w-sm mx-auto mt-6 mb-8">
          <form onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <Alert
                type="error"
                title={t("error")}
                autoFocus
                description={error}
                className="mb-6"
              />
            )}

            <FormField
              ref={register({
                pattern: {
                  value: /^[a-zA-Z0-9 _-]{0,16}$/,
                  message: t("ledgerNameConstraint"),
                },
              })}
              label={t("accountName")}
              labelDescription={t("ledgerNameInputDescription")}
              id="create-ledger-name"
              type="text"
              name="name"
              placeholder={defaultName}
              errorCaption={errors.name?.message}
              containerClassName="mb-4"
            />

            <div className={classNames("mb-4", "flex flex-col")}>
              <h2
                className={classNames("mb-4", "leading-tight", "flex flex-col")}
              >
                <span className="text-base font-semibold text-gray-700">
                  <T id="derivation" />{" "}
                  <T id="optionalComment">
                    {(message) => (
                      <span className="text-sm font-light text-gray-600">
                        {message}
                      </span>
                    )}
                  </T>
                </span>

                <span
                  className={classNames(
                    "mt-1",
                    "text-xs font-light text-gray-600"
                  )}
                  style={{ maxWidth: "90%" }}
                >
                  <T
                    id="defaultDerivationPathLabel"
                    substitutions={[<b>44'/1729'/0'/0'</b>]}
                  />
                  <br />
                  <T id="clickOnCustomDerivationPath" />
                </span>
              </h2>
              <div
                className={classNames(
                  "rounded-md overflow-hidden",
                  "border-2 bg-gray-100",
                  "flex flex-col",
                  "text-gray-700 text-sm leading-tight"
                )}
              >
                {DERIVATION_PATHS.map((dp, i, arr) => {
                  const last = i === arr.length - 1;
                  const selected = derivationPath.type === dp.type;
                  const handleClick = () => {
                    setDerivationPath(dp);
                  };

                  return (
                    <button
                      key={dp.type}
                      type="button"
                      className={classNames(
                        "block w-full",
                        "overflow-hidden",
                        !last && "border-b border-gray-200",
                        selected
                          ? "bg-gray-300"
                          : "hover:bg-gray-200 focus:bg-gray-200",
                        "flex items-center",
                        "text-gray-700",
                        "transition ease-in-out duration-200",
                        "focus:outline-none",
                        "opacity-90 hover:opacity-100"
                      )}
                      style={{
                        padding: "0.4rem 0.375rem 0.4rem 0.375rem",
                      }}
                      onClick={handleClick}
                    >
                      {dp.name}
                      <div className="flex-1" />
                      {selected && (
                        <OkIcon
                          className={classNames("mx-2 h-4 w-auto stroke-2")}
                          style={{
                            stroke: "#777",
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {derivationPath.type === "another" && (
              <FormField
                ref={register({
                  min: { value: 1, message: t("positiveIntMessage") },
                  required: t("required"),
                })}
                min={0}
                type="number"
                name="accountNumber"
                id="importacc-acc-number"
                label={t("accountNumber")}
                placeholder="1"
                errorCaption={errors.accountNumber?.message}
              />
            )}

            {derivationPath.type === "custom" && (
              <FormField
                ref={register({
                  required: t("required"),
                  validate: validateDerivationPath,
                })}
                name="customDerivationPath"
                id="importacc-cdp"
                label={t("customDerivationPath")}
                placeholder={t("derivationPathExample2")}
                errorCaption={errors.customDerivationPath?.message}
                containerClassName="mb-6"
              />
            )}

            <T id="addLedgerAccount">
              {(message) => (
                <FormSubmitButton loading={submitting} className="mt-8">
                  {message}
                </FormSubmitButton>
              )}
            </T>
          </form>
        </div>

        <ConfirmLedgerOverlay displayed={submitting} />
      </div>
    </PageLayout>
  );
};

export default ConnectLedger;
