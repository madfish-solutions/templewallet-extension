import * as React from "react";
import classNames from "clsx";
import { useLocation } from "lib/woozie";
import {
  useTempleClient,
  useAccount,
  useRelevantAccounts,
  TempleAccountType,
  TempleDAppPayload,
  TempleAccount,
} from "lib/temple/front";
import { useRetryableSWR } from "lib/swr";
import useSafeState from "lib/ui/useSafeState";
import { T, t } from "lib/i18n/react";
import ErrorBoundary from "app/ErrorBoundary";
import Unlock from "app/pages/Unlock";
import ContentContainer from "app/layouts/ContentContainer";
import AccountBanner from "app/templates/AccountBanner";
import NetworkBanner from "app/templates/NetworkBanner";
import Balance from "app/templates/Balance";
import CustomSelect, { OptionRenderProps } from "app/templates/CustomSelect";
import Identicon from "app/atoms/Identicon";
import Name from "app/atoms/Name";
import AccountTypeBadge from "app/atoms/AccountTypeBadge";
import Alert from "app/atoms/Alert";
import Money from "app/atoms/Money";
import Spinner from "app/atoms/Spinner";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import FormSecondaryButton from "app/atoms/FormSecondaryButton";
import ConfirmLedgerOverlay from "app/atoms/ConfirmLedgerOverlay";
import HashShortView from "app/atoms/HashShortView";
import SubTitle from "app/atoms/SubTitle";
import DAppLogo from "app/templates/DAppLogo";
import OperationView from "app/templates/OperationView";
import ConnectBanner from "app/templates/ConnectBanner";

const ConfirmPage: React.FC = () => {
  const { ready } = useTempleClient();

  return React.useMemo(
    () =>
      ready ? (
        <ContentContainer
          padding={false}
          className={classNames(
            "min-h-screen",
            "flex flex-col items-center justify-center"
          )}
        >
          <ErrorBoundary whileMessage={t("fetchingConfirmationDetails")}>
            <React.Suspense
              fallback={
                <div className="flex items-center justify-center h-screen">
                  <div>
                    <Spinner theme="primary" className="w-20" />
                  </div>
                </div>
              }
            >
              <ConfirmDAppForm />
            </React.Suspense>
          </ErrorBoundary>
        </ContentContainer>
      ) : (
        <Unlock canImportNew={false} />
      ),
    [ready]
  );
};

export default ConfirmPage;

const getPkh = (account: TempleAccount) => account.publicKeyHash;

const ConfirmDAppForm: React.FC = () => {
  const {
    getDAppPayload,
    confirmDAppPermission,
    confirmDAppOperation,
    confirmDAppSign,
  } = useTempleClient();
  const allAccounts = useRelevantAccounts(false);
  const account = useAccount();

  const [accountPkhToConnect, setAccountPkhToConnect] = React.useState(
    account.publicKeyHash
  );

  const loc = useLocation();
  const id = React.useMemo(() => {
    const usp = new URLSearchParams(loc.search);
    const id = usp.get("id");
    if (!id) {
      throw new Error(t("notIdentified"));
    }
    return id;
  }, [loc.search]);

  const { data } = useRetryableSWR<TempleDAppPayload>([id], getDAppPayload, {
    suspense: true,
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
  const payload = data!;

  const connectedAccount = React.useMemo(
    () =>
      allAccounts.find(
        (a) =>
          a.publicKeyHash ===
          (payload.type === "connect" ? accountPkhToConnect : payload.sourcePkh)
      ),
    [payload, allAccounts, accountPkhToConnect]
  );

  const AccountOptionContent = React.useMemo(
    () => AccountOptionContentHOC(payload.networkRpc),
    [payload.networkRpc]
  );

  const onConfirm = React.useCallback(
    async (confimed: boolean) => {
      switch (payload.type) {
        case "connect":
          return confirmDAppPermission(id, confimed, accountPkhToConnect);

        case "confirm_operations":
          return confirmDAppOperation(id, confimed);

        case "sign":
          return confirmDAppSign(id, confimed);
      }
    },
    [
      id,
      payload.type,
      confirmDAppPermission,
      confirmDAppOperation,
      confirmDAppSign,
      accountPkhToConnect,
    ]
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
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

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

  const content = React.useMemo(() => {
    switch (payload.type) {
      case "connect":
        return {
          title: t("confirmAction", t("connection").toLowerCase()),
          declineActionTitle: t("cancel"),
          confirmActionTitle: error ? t("retry") : t("connect"),
          want: (
            <T
              id="appWouldLikeToConnectToYourWallet"
              substitutions={[
                <React.Fragment key="appName">
                  <span className="font-semibold">{payload.origin}</span>
                  <br />
                </React.Fragment>,
              ]}
            >
              {(message) => (
                <p className="mb-2 text-sm text-center text-gray-700">
                  {message}
                </p>
              )}
            </T>
          ),
        };

      case "confirm_operations":
        return {
          title: t("confirmAction", t("operations").toLowerCase()),
          declineActionTitle: t("reject"),
          confirmActionTitle: error ? t("retry") : t("confirm"),
          want: (
            <div
              className={classNames(
                "mb-2 text-sm text-center text-gray-700",
                "flex flex-col items-center"
              )}
            >
              <div className="flex items-center justify-center">
                <DAppLogo origin={payload.origin} size={16} className="mr-1" />
                <Name className="font-semibold" style={{ maxWidth: "10rem" }}>
                  {payload.appMeta.name}
                </Name>
              </div>
              <T
                id="appRequestOperationToYou"
                substitutions={[
                  <Name className="max-w-full text-xs italic" key="origin">
                    {payload.origin}
                  </Name>,
                ]}
              />
            </div>
          ),
        };

      case "sign":
        return {
          title: t("confirmAction", t("signAction").toLowerCase()),
          declineActionTitle: t("reject"),
          confirmActionTitle: t("signAction"),
          want: (
            <div
              className={classNames(
                "mb-2 text-sm text-center text-gray-700",
                "flex flex-col items-center"
              )}
            >
              <div className="flex items-center justify-center">
                <DAppLogo origin={payload.origin} size={16} className="mr-1" />
                <Name className="font-semibold" style={{ maxWidth: "10rem" }}>
                  {payload.appMeta.name}
                </Name>
              </div>
              <T
                id="appRequestsToSign"
                substitutions={[
                  <Name className="max-w-full text-xs italic" key="origin">
                    {payload.origin}
                  </Name>,
                ]}
              />
            </div>
          ),
        };
    }
  }, [payload.type, payload.origin, payload.appMeta.name, error]);

  return (
    <div
      className={classNames(
        "relative bg-white rounded-md shadow-md overflow-y-auto",
        "flex flex-col"
      )}
      style={{
        width: 380,
        height: 578,
      }}
    >
      <div className="flex flex-col items-center px-4 py-2">
        <SubTitle
          className={payload.type === "connect" ? "mt-4 mb-6" : "mt-4 mb-2"}
        >
          {content.title}
        </SubTitle>

        {payload.type === "connect" && (
          <ConnectBanner
            type={payload.type}
            origin={payload.origin}
            appMeta={payload.appMeta}
            className="mb-4"
          />
        )}

        {content.want}

        {payload.type === "connect" && (
          <T id="viewAccountAddressWarning">
            {(message) => (
              <p className="mb-4 text-xs font-light text-center text-gray-700">
                {message}
              </p>
            )}
          </T>
        )}

        {error ? (
          <Alert
            closable
            onClose={handleErrorAlertClose}
            type="error"
            title="Error"
            description={error?.message ?? t("smthWentWrong")}
            className="my-4"
            autoFocus
          />
        ) : (
          <>
            {payload.type !== "connect" && connectedAccount && (
              <AccountBanner
                account={connectedAccount}
                networkRpc={payload.networkRpc}
                labelIndent="sm"
                className="w-full mb-4"
              />
            )}

            <NetworkBanner
              rpc={payload.networkRpc}
              narrow={payload.type === "connect"}
            />

            {payload.type === "connect" ? (
              <div className={classNames("w-full", "flex flex-col")}>
                <h2
                  className={classNames(
                    "mb-2",
                    "leading-tight",
                    "flex flex-col"
                  )}
                >
                  <T id="account">
                    {(message) => (
                      <span className="text-base font-semibold text-gray-700">
                        {message}
                      </span>
                    )}
                  </T>

                  <T id="toBeConnectedWithDApp">
                    {(message) => (
                      <span
                        className={classNames(
                          "mt-px",
                          "text-xs font-light text-gray-600"
                        )}
                        style={{ maxWidth: "90%" }}
                      >
                        {message}
                      </span>
                    )}
                  </T>
                </h2>

                <CustomSelect<TempleAccount, string>
                  activeItemId={accountPkhToConnect}
                  getItemId={getPkh}
                  items={allAccounts}
                  maxHeight="8rem"
                  onSelect={setAccountPkhToConnect}
                  OptionIcon={AccountIcon}
                  OptionContent={AccountOptionContent}
                  autoFocus
                />
              </div>
            ) : (
              <OperationView
                payload={payload}
                networkRpc={payload.networkRpc}
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
          <FormSecondaryButton
            type="button"
            className="justify-center w-full"
            loading={declining}
            onClick={handleDeclineClick}
          >
            {content.declineActionTitle}
          </FormSecondaryButton>
        </div>

        <div className="w-1/2 pl-2">
          <FormSubmitButton
            type="button"
            className="justify-center w-full"
            loading={confirming}
            onClick={handleConfirmClick}
          >
            {content.confirmActionTitle}
          </FormSubmitButton>
        </div>
      </div>

      <ConfirmLedgerOverlay
        displayed={confirming && account.type === TempleAccountType.Ledger}
      />
    </div>
  );
};

const AccountIcon: React.FC<OptionRenderProps<TempleAccount>> = ({ item }) => (
  <Identicon
    type="bottts"
    hash={item.publicKeyHash}
    size={32}
    className="flex-shrink-0 shadow-xs"
  />
);

const AccountOptionContentHOC = (networkRpc: string) => {
  return React.memo<OptionRenderProps<TempleAccount>>(({ item: acc }) => (
    <>
      <div className="flex flex-wrap items-center">
        <Name className="text-sm font-medium leading-tight">{acc.name}</Name>
        <AccountTypeBadge account={acc} />
      </div>

      <div className="flex flex-wrap items-center mt-1">
        <div className={classNames("text-xs leading-none", "text-gray-700")}>
          <HashShortView hash={acc.publicKeyHash} />
        </div>

        <Balance address={acc.publicKeyHash} networkRpc={networkRpc}>
          {(bal) => (
            <div
              className={classNames(
                "ml-2",
                "text-xs leading-none",
                "text-gray-600"
              )}
            >
              <Money>{bal}</Money>{" "}
              <span style={{ fontSize: "0.75em" }}>tez</span>
            </div>
          )}
        </Balance>
      </div>
    </>
  ));
};
