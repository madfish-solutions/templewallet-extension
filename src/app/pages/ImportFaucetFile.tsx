import * as React from "react";
import classNames from "clsx";
import { navigate } from "lib/woozie";
import {
  ActivationStatus,
  useAllAccounts,
  useSetAccountPkh,
  useThanosClient,
  useTezos,
} from "lib/thanos/front";
import useSafeState from "lib/ui/useSafeState";
import PageLayout from "app/layouts/PageLayout";
import Alert from "app/atoms/Alert";
import { ReactComponent as CodeAlt } from "app/icons/code-alt.svg";

const ImportFaucetFile: React.FC = () => {
  const allAccounts = useAllAccounts();
  const setAccountPkh = useSetAccountPkh();

  const prevAccLengthRef = React.useRef(allAccounts.length);
  React.useEffect(() => {
    const accLength = allAccounts.length;
    if (prevAccLengthRef.current < accLength) {
      setAccountPkh(allAccounts[accLength - 1].publicKeyHash);
      navigate("/");
    }
    prevAccLengthRef.current = accLength;
  }, [allAccounts, setAccountPkh]);

  return (
    <PageLayout
      pageTitle={
        <>
          <CodeAlt className="mr-1 h-4 w-auto stroke-current" />
          Import Faucet File
        </>
      }
    >
      <Form />
    </PageLayout>
  );
};

export default ImportFaucetFile;

interface FaucetData {
  mnemonic: string[];
  secret: string;
  amount: string;
  pkh: string;
  password: string;
  email: string;
}

const Form: React.FC = () => {
  const { importFundraiserAccount } = useThanosClient();
  const tezos = useTezos();

  const activateAccount = React.useCallback(
    async (address: string, secret: string) => {
      let op;
      try {
        op = await tezos.tz.activate(address, secret);
      } catch (err) {
        const invalidActivationError =
          err && err.body && /Invalid activation/.test(err.body);
        if (invalidActivationError) {
          return [ActivationStatus.AlreadyActivated] as [ActivationStatus];
        }

        throw err;
      }

      return [ActivationStatus.ActivationRequestSent, op] as [
        ActivationStatus,
        typeof op
      ];
    },
    [tezos]
  );

  const formRef = React.useRef<HTMLFormElement>(null);
  const [processing, setProcessing] = useSafeState(false);
  const [alert, setAlert] = useSafeState<React.ReactNode | Error>(null);

  const handleFormSubmit = React.useCallback((evt) => {
    evt.preventDefault();
  }, []);

  const handleUploadChange = React.useCallback(
    async (evt) => {
      if (processing) return;
      setProcessing(true);
      setAlert(null);

      try {
        let data: FaucetData;
        try {
          data = await new Promise((res, rej) => {
            const reader = new FileReader();

            reader.onerror = () => {
              rej();
              reader.abort();
            };

            reader.onload = (readEvt: any) => {
              try {
                const data = JSON.parse(readEvt.target.result);
                if (
                  ![
                    data.pkh,
                    data.secret,
                    data.mnemonic,
                    data.email,
                    data.password,
                  ].every(Boolean)
                ) {
                  return rej();
                }

                res(data);
              } catch (err) {
                rej(err);
              }
            };

            reader.readAsText(evt.target.files[0]);
          });
        } catch (_err) {
          throw new Error("Unexpected or invalid file");
        }

        const [activationStatus, op] = await activateAccount(
          data.pkh,
          data.secret
        );

        if (activationStatus === ActivationStatus.ActivationRequestSent) {
          setAlert("🛫 Activation request sent! Confirming...");
          await op!.confirmation();
        }

        await importFundraiserAccount(
          data.email,
          data.password,
          data.mnemonic.join(" ")
        );
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

        // Human delay.
        await new Promise((res) => setTimeout(res, 300));

        setAlert(err);
      } finally {
        formRef.current?.reset();
        setProcessing(false);
      }
    },
    [
      processing,
      setProcessing,
      setAlert,
      activateAccount,
      importFundraiserAccount,
    ]
  );

  return (
    <form
      ref={formRef}
      className="mt-6 mb-8 w-full max-w-sm mx-auto"
      onSubmit={handleFormSubmit}
    >
      {alert && (
        <Alert
          type={alert instanceof Error ? "error" : "success"}
          title={alert instanceof Error ? "Error" : "Success"}
          description={
            alert instanceof Error
              ? alert?.message ?? "Something went wrong"
              : alert
          }
          className="mb-6"
        />
      )}

      <div className="w-full flex flex-col">
        <label className={classNames("mb-4", "leading-tight", "flex flex-col")}>
          <span className="text-base font-semibold text-gray-700">
            Faucet file
          </span>

          <span
            className={classNames("mt-1", "text-xs font-light text-gray-600")}
            style={{ maxWidth: "90%" }}
          >
            Drag & drop a file or select it manually by clicking on the area
            below. You can download it from{" "}
            <a
              href="https://faucet.tzalpha.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-normal underline"
            >
              https://faucet.tzalpha.net
            </a>
            .
          </span>
        </label>

        <div className="w-full mb-2 relative">
          <input
            className={classNames(
              "appearance-none",
              "absolute inset-0 w-full",
              "block py-2 px-4",
              "opacity-0",
              "cursor-pointer"
            )}
            type="file"
            name="documents[]"
            accept=".json,application/json"
            disabled={processing}
            onChange={handleUploadChange}
          />

          <div
            className={classNames(
              "w-full",
              "px-4 py-6",
              "border-2 border-dashed",
              "border-gray-300",
              "focus:border-primary-orange",
              "bg-gray-100 focus:bg-transparent",
              "focus:outline-none focus:shadow-outline",
              "transition ease-in-out duration-200",
              "rounded-md",
              "text-gray-400 text-lg leading-tight",
              "placeholder-alphagray"
            )}
          >
            <svg
              width={48}
              height={48}
              viewBox="0 0 24 24"
              aria-labelledby="uploadIconTitle"
              stroke="#e2e8f0"
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
              color="#e2e8f0"
              className="mx-auto m-4"
            >
              <title>{"Upload"}</title>
              <path d="M12 4v13M7 8l5-5 5 5M20 21H4" />
            </svg>
            <div className="w-full text-center">
              {processing ? (
                "Processing..."
              ) : (
                <>
                  Select <b>JSON</b> file
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
