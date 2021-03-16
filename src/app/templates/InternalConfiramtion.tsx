import * as React from "react";
import classNames from "clsx";
import { localForger } from "@taquito/local-forging";
import {
  TempleAccountType,
  TempleAssetType,
  TempleConfirmationPayload,
  tryParseExpenses,
  useAssets,
  useNetwork,
  useRelevantAccounts,
  TEZ_ASSET,
} from "lib/temple/front";
import useSafeState from "lib/ui/useSafeState";
import { T, t } from "lib/i18n/react";
import { useRetryableSWR } from "lib/swr";
import { useAppEnv } from "app/env";
import AccountBanner from "app/templates/AccountBanner";
import OperationsBanner from "app/templates/OperationsBanner";
import NetworkBanner from "app/templates/NetworkBanner";
import RawPayloadView from "app/templates/RawPayloadView";
import ViewsSwitcher from "app/templates/ViewsSwitcher";
import ExpensesView from "app/templates/ExpensesView";
import Logo from "app/atoms/Logo";
import Alert from "app/atoms/Alert";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import FormSecondaryButton from "app/atoms/FormSecondaryButton";
import ConfirmLedgerOverlay from "app/atoms/ConfirmLedgerOverlay";
import SubTitle from "app/atoms/SubTitle";
import { ReactComponent as EyeIcon } from "app/icons/eye.svg";
import { ReactComponent as CodeAltIcon } from "app/icons/code-alt.svg";
import { ReactComponent as HashIcon } from "app/icons/hash.svg";

type InternalConfiramtionProps = {
  payload: TempleConfirmationPayload;
  onConfirm: (confirmed: boolean) => Promise<void>;
};

const InternalConfiramtion: React.FC<InternalConfiramtionProps> = ({
  payload,
  onConfirm,
}) => {
  const { rpcBaseURL: currentNetworkRpc } = useNetwork();
  const { popup } = useAppEnv();

  const getContentToParse = React.useCallback(async () => {
    switch (payload.type) {
      case "operations":
        return payload.opParams || [];
      case "sign":
        const unsignedBytes = payload.bytes.substr(
          0,
          payload.bytes.length - 128
        );
        try {
          return (await localForger.parse(unsignedBytes)) || [];
        } catch (err) {
          if (process.env.NODE_ENV === "development") {
            console.error(err);
          }
          return [];
        }
      default:
        return [];
    }
  }, [payload]);
  const { data: contentToParse } = useRetryableSWR(
    ["content-to-parse"],
    getContentToParse,
    { suspense: true }
  );

  const allAccounts = useRelevantAccounts();
  const { allAssetsWithHidden } = useAssets();
  const account = React.useMemo(
    () => allAccounts.find((a) => a.publicKeyHash === payload.sourcePkh)!,
    [allAccounts, payload.sourcePkh]
  );
  const rawExpensesData = React.useMemo(
    () => tryParseExpenses(contentToParse!, account.publicKeyHash),
    [contentToParse, account.publicKeyHash]
  );
  const expensesData = React.useMemo(() => {
    return rawExpensesData.map(({ expenses, ...restProps }) => ({
      expenses: expenses.map(({ tokenAddress, ...restProps }) => ({
        asset: tokenAddress
          ? allAssetsWithHidden.find(
              (asset) =>
                asset.type !== TempleAssetType.TEZ &&
                asset.address === tokenAddress
            ) || tokenAddress
          : TEZ_ASSET,
        ...restProps,
      })),
      ...restProps,
    }));
  }, [allAssetsWithHidden, rawExpensesData]);

  const signPayloadFormats = React.useMemo(() => {
    if (payload.type === "operations") {
      return [
        {
          key: "preview",
          name: t("preview"),
          Icon: EyeIcon,
        },
        {
          key: "raw",
          name: t("raw"),
          Icon: CodeAltIcon,
        },
        ...(payload.bytesToSign
          ? [
              {
                key: "bytes",
                name: t("bytes"),
                Icon: HashIcon,
              },
            ]
          : []),
      ];
    }

    return [
      {
        key: "preview",
        name: t("preview"),
        Icon: EyeIcon,
      },
      {
        key: "bytes",
        name: t("bytes"),
        Icon: HashIcon,
      },
    ];
  }, [payload]);

  const [spFormat, setSpFormat] = useSafeState(signPayloadFormats[0]);
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
          <Logo hasTitle />
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
          <SubTitle className="mb-6">
            <T
              id="confirmAction"
              substitutions={t(
                payload.type === "sign" ? "signAction" : "operations"
              )}
            />
          </SubTitle>

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

              <NetworkBanner
                rpc={
                  payload.type === "operations"
                    ? payload.networkRpc
                    : currentNetworkRpc
                }
              />

              {signPayloadFormats.length > 1 && (
                <div className="w-full flex justify-end mb-3 items-center">
                  <span
                    className={classNames(
                      "mr-2",
                      "text-base font-semibold text-gray-700"
                    )}
                  >
                    <T id="operations" />
                  </span>

                  <div className="flex-1" />

                  <ViewsSwitcher
                    activeItem={spFormat}
                    items={signPayloadFormats}
                    onChange={setSpFormat}
                  />
                </div>
              )}

              {payload.type === "operations" && spFormat.key === "raw" && (
                <OperationsBanner
                  opParams={payload.rawToSign ?? payload.opParams}
                  jsonViewStyle={
                    signPayloadFormats.length > 1
                      ? { height: "9.5rem" }
                      : undefined
                  }
                />
              )}

              {payload.type === "sign" && spFormat.key === "bytes" && (
                <>
                  <RawPayloadView
                    rows={7}
                    label={t("payloadToSign")}
                    payload={payload.bytes}
                    className="mb-4"
                  />
                </>
              )}

              {payload.type === "operations" &&
                payload.bytesToSign &&
                spFormat.key === "bytes" && (
                  <>
                    <RawPayloadView
                      rows={5}
                      payload={payload.bytesToSign}
                      className="mb-4"
                    />
                  </>
                )}

              {spFormat.key === "preview" && (
                <ExpensesView expenses={expensesData} />
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
          displayed={confirming && account.type === TempleAccountType.Ledger}
        />
      </div>
    </div>
  );
};

export default InternalConfiramtion;
