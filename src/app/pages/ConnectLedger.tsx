import * as React from "react";
import classNames from "clsx";
import { useForm } from "react-hook-form";
import { navigate } from "lib/woozie";
import {
  useThanosClient,
  useSetAccountPkh,
  useAllAccounts,
  ThanosAccountType,
  validateDerivationPath,
} from "lib/thanos/front";
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
};

const DERIVATION_PATHS = [
  {
    type: "default",
    name: "Default account",
  },
  {
    type: "custom",
    name: "Custom derivation path",
  },
];

const ConnectLedger: React.FC = () => {
  const { createLedgerAccount } = useThanosClient();
  const allAccounts = useAllAccounts();
  const setAccountPkh = useSetAccountPkh();
  const allLedgers = React.useMemo(
    () => allAccounts.filter((acc) => acc.type === ThanosAccountType.Ledger),
    [allAccounts]
  );

  const defaultName = React.useMemo(() => `Ledger ${allLedgers.length + 1}`, [
    allLedgers.length,
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

  const { register, handleSubmit, errors, formState } = useForm<FormData>({
    defaultValues: {
      name: defaultName,
      customDerivationPath: "m/44'/1729'/0'/0'",
    },
  });
  const submitting = formState.isSubmitting;

  const [error, setError] = React.useState<React.ReactNode>(null);
  const [derivationPath, setDerivationPath] = React.useState(
    DERIVATION_PATHS[0]
  );

  const onSubmit = React.useCallback(
    async ({ name, customDerivationPath }: FormData) => {
      if (submitting) return;
      setError(null);

      try {
        await createLedgerAccount(name, customDerivationPath);
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
        <>
          <LinkIcon className="w-auto h-4 mr-1 stroke-current" />
          Connect Ledger
        </>
      }
    >
      <div className="relative w-full">
        <div className="w-full max-w-sm mx-auto mt-6 mb-8">
          <form onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <Alert
                type="error"
                title="Error"
                autoFocus
                description={error}
                className="mb-6"
              />
            )}

            <FormField
              ref={register({
                pattern: {
                  value: /^[a-zA-Z0-9 _-]{0,16}$/,
                  message: "1-16 characters, no special",
                },
              })}
              label="Account name"
              labelDescription="What will be the name of the new Ledger account?"
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
                  Derivation{" "}
                  <span className="text-sm font-light text-gary-600">
                    (optional)
                  </span>
                </span>

                <span
                  className={classNames(
                    "mt-1",
                    "text-xs font-light text-gray-600"
                  )}
                  style={{ maxWidth: "90%" }}
                >
                  By default <b>44'/1729'/0'/0'</b> derivation is used.
                  <br />
                  Click on 'Custom derivation path' to customize it.
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

            {derivationPath.type === "custom" && (
              <FormField
                ref={register({
                  required: "Required",
                  validate: validateDerivationPath,
                })}
                name="customDerivationPath"
                id="importacc-cdp"
                label="Custom derivation path"
                placeholder="e.g. m/44'/1729'/..."
                errorCaption={errors.customDerivationPath?.message}
                containerClassName="mb-6"
              />
            )}

            <FormSubmitButton loading={submitting} className="mt-8">
              Add Ledger Account
            </FormSubmitButton>
          </form>
        </div>

        <ConfirmLedgerOverlay displayed={submitting} />

        {process.env.TARGET_BROWSER === "firefox" && (
          <div
            className={classNames(
              "absolute inset-0",
              "bg-white bg-opacity-90",
              "p-4",
              "flex flex-col items-center justify-center"
            )}
          >
            <h1
              className={classNames(
                "mb-8",
                "text-center",
                "text-xl font-medium tracking-tight text-gray-600"
              )}
            >
              <span className="text-base font-normal">
                <span className="text-gray-700">Sorry!</span> Connection to the{" "}
                <span className="text-gray-700">Ledger Nano</span>
                <br />
                device via <span className="text-gray-700">Firefox</span> is
                temporarily <span className="text-gray-700">unavailable</span>.
              </span>
            </h1>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default ConnectLedger;
