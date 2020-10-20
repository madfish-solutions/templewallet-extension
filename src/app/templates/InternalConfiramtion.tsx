import * as React from "react";
import classNames from "clsx";
import {
  ThanosAccountType,
  ThanosConfirmationPayload,
  useRelevantAccounts,
} from "lib/thanos/front";
import useSafeState from "lib/ui/useSafeState";
import { T, t } from "lib/i18n/react";
import { useAppEnv } from "app/env";
import AccountBanner from "app/templates/AccountBanner";
import OperationsBanner from "app/templates/OperationsBanner";
import NetworkBanner from "app/templates/NetworkBanner";
import FormField from "app/atoms/FormField";
import Logo from "app/atoms/Logo";
import Alert from "app/atoms/Alert";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import FormSecondaryButton from "app/atoms/FormSecondaryButton";
import ConfirmLedgerOverlay from "app/atoms/ConfirmLedgerOverlay";
import { ReactComponent as ComponentIcon } from "app/icons/component.svg";

type InternalConfiramtionProps = {
  payload: ThanosConfirmationPayload;
  onConfirm: (confirmed: boolean) => Promise<void>;
};

const InternalConfiramtion: React.FC<InternalConfiramtionProps> = ({
  payload,
  onConfirm,
}) => {
  const { popup } = useAppEnv();

  const allAccounts = useRelevantAccounts();
  const account = React.useMemo(
    () => allAccounts.find((a) => a.publicKeyHash === payload.sourcePkh)!,
    [allAccounts, payload.sourcePkh]
  );

  const [error, setError] = useSafeState<any>(null);
  const [confirming, setConfirming] = useSafeState(false);
  const [declining, setDeclining] = useSafeState(false);

  const confirm = React.useCallback(
    async (confirmed: boolean) => {
      setError(null);
      try {
        await onConfirm(confirmed);
      } catch (err) {
        // Human delay.
        await new Promise((res) => setTimeout(res, 300));
        setError(err);
      }
    },
    [onConfirm, setError]
  );

  const handleConfirmClick = React.useCallback(async () => {
    if (confirming || declining) return;

    setConfirming(true);
    await confirm(true);
    setConfirming(false);
  }, [confirming, declining, setConfirming, confirm]);

  const handleDeclineClick = React.useCallback(async () => {
    if (confirming || declining) return;

    setDeclining(true);
    await confirm(false);
    setDeclining(false);
  }, [confirming, declining, setDeclining, confirm]);

  const handleErrorAlertClose = React.useCallback(() => setError(null), [
    setError,
  ]);

  return (
    <div
      className={classNames(
        "h-full w-full",
        "max-w-sm mx-auto",
        "flex flex-col",
        !popup && "justify-center px-2"
      )}
    >
      <div
        className={classNames(
          "flex flex-col items-center justify-center",
          popup && "flex-1"
        )}
      >
        <div className="flex items-center my-4">
          <Logo />

          <h1
            className={classNames(
              "ml-2",
              "text-2xl font-semibold tracking-tight",
              "text-gray-700"
            )}
          >
            Thanos
          </h1>
        </div>
      </div>

      <div
        className={classNames(
          "relative bg-white shadow-md",
          popup ? "border-t border-gray-200" : "rounded-md",
          "overflow-y-auto",
          "flex flex-col"
        )}
        style={{ height: "32rem" }}
      >
        <div className="px-4 pt-4">
          <T
            id="confirmAction"
            substitutions={t(
              payload.type === "sign" ? "signAction" : "operations"
            )}
          >
            {(message) => <SubTitle>{message}</SubTitle>}
          </T>

          {error ? (
            <Alert
              closable
              onClose={handleErrorAlertClose}
              type="error"
              title={t("error")}
              description={error?.message ?? t("smthWentWrong")}
              className="my-4"
              autoFocus
            />
          ) : (
            <>
              <AccountBanner
                account={account}
                labelIndent="sm"
                className="w-full mb-4"
              />

              {payload.type === "operations" && (
                <>
                  <NetworkBanner rpc={payload.networkRpc} />
                  <OperationsBanner opParams={payload.opParams} />
                </>
              )}

              {payload.type === "sign" && (
                <FormField
                  textarea
                  rows={7}
                  id="sign-payload"
                  label={t("payloadToSign")}
                  value={payload.bytes}
                  spellCheck={false}
                  readOnly
                  className="mb-4"
                  style={{
                    resize: "none",
                  }}
                />
              )}
            </>
          )}
        </div>

        <div className="flex-1" />

        <div
          className={classNames(
            "sticky bottom-0 w-full",
            "bg-white shadow-md",
            "flex items-stretch",
            "px-4 pt-2 pb-4"
          )}
        >
          <div className="w-1/2 pr-2">
            <T id="decline">
              {(message) => (
                <FormSecondaryButton
                  type="button"
                  className="justify-center w-full"
                  loading={declining}
                  disabled={declining}
                  onClick={handleDeclineClick}
                >
                  {message}
                </FormSecondaryButton>
              )}
            </T>
          </div>

          <div className="w-1/2 pl-2">
            <T id={error ? "retry" : "confirm"}>
              {(message) => (
                <FormSubmitButton
                  type="button"
                  className="justify-center w-full"
                  loading={confirming}
                  onClick={handleConfirmClick}
                >
                  {message}
                </FormSubmitButton>
              )}
            </T>
          </div>
        </div>

        <ConfirmLedgerOverlay
          displayed={confirming && account.type === ThanosAccountType.Ledger}
        />
      </div>
    </div>
  );
};

export default InternalConfiramtion;

type SubTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

const SubTitle: React.FC<SubTitleProps> = ({
  className,
  children,
  ...rest
}) => {
  const comp = (
    <span className="px-1 text-gray-500">
      <ComponentIcon className="w-auto h-5 stroke-current" />
    </span>
  );

  return (
    <h2
      className={classNames(
        "mb-6",
        "flex items-center justify-center",
        "text-gray-700",
        "text-lg",
        "font-light",
        "uppercase",
        className
      )}
      {...rest}
    >
      {comp}
      {children}
      {comp}
    </h2>
  );
};
