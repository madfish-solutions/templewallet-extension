import * as React from "react";
import classNames from "clsx";
import { useLocation } from "lib/woozie";
import {
  useThanosClient,
  useAccount,
  useAllAccounts,
  ThanosAccountType,
  ThanosDAppPayload,
  XTZ_ASSET,
  ThanosAccount,
} from "lib/thanos/front";
import { useRetryableSWR } from "lib/swr";
import useSafeState from "lib/ui/useSafeState";
import { ThanosDAppMetadata } from "@thanos-wallet/dapp/dist/types";
import ErrorBoundary from "app/ErrorBoundary";
import Unlock from "app/pages/Unlock";
import ContentContainer from "app/layouts/ContentContainer";
import AccountBanner from "app/templates/AccountBanner";
import NetworkBanner from "app/templates/NetworkBanner";
import OperationsBanner from "app/templates/OperationsBanner";
import Balance from "app/templates/Balance";
import SelectMenu, { OptionRenderProps } from "app/templates/SelectMenu";
import Logo from "app/atoms/Logo";
import Identicon from "app/atoms/Identicon";
import Name from "app/atoms/Name";
import Alert from "app/atoms/Alert";
import Money from "app/atoms/Money";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import FormSecondaryButton from "app/atoms/FormSecondaryButton";
import { ReactComponent as ComponentIcon } from "app/icons/component.svg";
import { ReactComponent as OkIcon } from "app/icons/ok.svg";
import { ReactComponent as LayersIcon } from "app/icons/layers.svg";

const ConfirmPage: React.FC = () => {
  const { ready } = useThanosClient();
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
          <ErrorBoundary whileMessage="fetching confirmation details">
            <React.Suspense fallback={null}>
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

const getPkh = (account: ThanosAccount) => account.publicKeyHash;

const ConfirmDAppForm: React.FC = () => {
  const {
    getDAppPayload,
    confirmDAppPermission,
    confirmDAppOperation,
  } = useThanosClient();
  const allAccounts = useAllAccounts();
  const account = useAccount();

  const [accountPkhToConnect, setAccountPkhToConnect] = React.useState(
    account.publicKeyHash
  );

  const loc = useLocation();
  const id = React.useMemo(() => {
    const usp = new URLSearchParams(loc.search);
    const id = usp.get("id");
    if (!id) {
      throw new Error("Not identified");
    }
    return id;
  }, [loc.search]);

  const { data } = useRetryableSWR<ThanosDAppPayload>([id], getDAppPayload, {
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

  const content = React.useMemo(() => {
    switch (payload.type) {
      case "connect":
        return {
          title: "Confirm connection",
          declineActionTitle: "Cancel",
          confirmActionTitle: "Connect",
          want: (
            <p className="mb-2 text-sm text-center text-gray-700">
              <span className="font-semibold">{payload.origin}</span>
              <br />
              would like to connect to your wallet
            </p>
          ),
        };

      case "confirm_operations":
        return {
          title: "Confirm operations",
          declineActionTitle: "Reject",
          confirmActionTitle: "Confirm",
          want: (
            <div
              className={classNames(
                "mb-2 text-sm text-center text-gray-700",
                "flex flex-col items-center"
              )}
            >
              <div className="flex items-center justify-center">
                <DAppLogo origin={payload.origin} size={16} className="mr-1" />
                <Name className="font-semibold" style={{ maxWidth: "7.5rem" }}>
                  {payload.appMeta.name}
                </Name>
              </div>
              <Name className="max-w-full text-xs italic">
                {payload.origin}
              </Name>
              requests operations to you
            </div>
          ),
        };
    }
  }, [payload.type, payload.origin, payload.appMeta.name]);

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
      }
    },
    [
      id,
      payload.type,
      confirmDAppPermission,
      confirmDAppOperation,
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
      <div className={classNames("absolute top-0 right-0", "p-1")}>
        <div
          className={classNames(
            "bg-red-500",
            "shadow",
            "rounded-sm",
            "px-2 py-px",
            "text-xs font-medium text-white"
          )}
        >
          Alpha
        </div>
      </div>

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
          <p className="mb-4 text-xs font-light text-center text-gray-700">
            This site is requesting access to view your account address. Always
            make sure you trust the sites you interact with.
          </p>
        )}

        {payload.type === "confirm_operations" && connectedAccount && (
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

        {payload.type === "confirm_operations" && (
          <OperationsBanner opParams={payload.opParams} />
        )}

        {payload.type === "connect" && (
          <div className={classNames("w-full", "mb-2", "flex flex-col")}>
            <h2
              className={classNames("mb-2", "leading-tight", "flex flex-col")}
            >
              <span className="text-base font-semibold text-gray-700">
                Account
              </span>

              <span
                className={classNames(
                  "mt-px",
                  "text-xs font-light text-gray-600"
                )}
                style={{ maxWidth: "90%" }}
              >
                to be connected with dApp.
              </span>
            </h2>

            <SelectMenu
              activeItemId={accountPkhToConnect}
              getItemId={getPkh}
              items={allAccounts}
              maxHeight="8rem"
              onSelect={setAccountPkhToConnect}
              Icon={AccountIcon}
              Content={AccountOptionContent}
            />
          </div>
        )}
      </div>

      {error && (
        <Alert
          type="error"
          title="Error"
          description={error?.message ?? "Something went wrong"}
          className="mb-6"
        />
      )}

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
    </div>
  );
};

const AccountIcon: React.FC<OptionRenderProps<ThanosAccount>> = ({ item }) => (
  <Identicon
    type="bottts"
    hash={item.publicKeyHash}
    size={32}
    className="flex-shrink-0 shadow-xs"
  />
);

const AccountOptionContentHOC = (networkRpc: string) => {
  return React.memo<OptionRenderProps<ThanosAccount>>(({ item: acc }) => (
    <>
      <div className="flex flex-wrap items-center">
        <Name className="text-sm font-medium leading-tight">{acc.name}</Name>

        {acc.type === ThanosAccountType.Imported && (
          <span
            className={classNames(
              "ml-2",
              "rounded-sm",
              "border border-black border-opacity-25",
              "px-1 py-px",
              "leading-tight",
              "text-black text-opacity-50"
            )}
            style={{ fontSize: "0.6rem" }}
          >
            Imported
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center mt-1">
        <div className={classNames("text-xs leading-none", "text-gray-700")}>
          {(() => {
            const val = acc.publicKeyHash;
            const ln = val.length;
            return (
              <>
                {val.slice(0, 7)}
                <span className="opacity-75">...</span>
                {val.slice(ln - 4, ln)}
              </>
            );
          })()}
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
              <span style={{ fontSize: "0.75em" }}>{XTZ_ASSET.symbol}</span>
            </div>
          )}
        </Balance>
      </div>
    </>
  ));
};

type ConnectBannerProps = {
  type: "connect" | "confirm_operations";
  origin: string;
  appMeta: ThanosDAppMetadata;
  className?: string;
};

const ConnectBanner: React.FC<ConnectBannerProps> = ({
  type,
  origin,
  appMeta,
  className,
}) => {
  const Icon = type === "connect" ? OkIcon : LayersIcon;

  return (
    <div
      className={classNames(
        "w-full flex items-center justify-around",
        className
      )}
    >
      <div
        className={classNames(
          "w-32",
          "border border-gray-200 rounded",
          "flex flex-col items-center",
          "p-2"
        )}
      >
        <DAppLogo origin={origin} size={32} className="flex-shrink-0 mb-1" />

        <span className="text-xs font-semibold text-gray-700">
          <Name style={{ maxWidth: "7.5rem" }}>{appMeta.name}</Name>
        </span>
      </div>

      <div className="relative flex-1 h-px bg-gray-300">
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={classNames(
              type === "connect" ? "bg-green-500" : "bg-orange-500",
              "rounded-full",
              "p-1",
              "flex items-center justify-center",
              "text-white"
            )}
          >
            <Icon className="w-auto h-4 stroke-current stroke-2" />
          </div>
        </div>
      </div>

      <div
        className={classNames(
          "w-32",
          "border border-gray-200 rounded",
          "flex flex-col items-center",
          "p-2"
        )}
      >
        <Logo className="mb-1" imgStyle={{ height: 32, margin: "auto" }} />

        <span className="text-xs font-semibold text-gray-700">Thanos</span>
      </div>
    </div>
  );
};

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

type DAppLogoProps = {
  origin: string;
  size: number;
  className?: string;
};

const DAppLogo = React.memo<DAppLogoProps>(({ origin, size, className }) => {
  const faviconSrc = React.useMemo(() => `${origin}/favicon.ico`, [origin]);
  const [faviconShowed, setFaviconShowed] = React.useState(true);
  const handleFaviconError = React.useCallback(() => {
    setFaviconShowed(false);
  }, [setFaviconShowed]);

  return faviconShowed ? (
    <div
      className={classNames("overflow-hidden", className)}
      style={{ width: size, height: size }}
    >
      <img
        src={faviconSrc}
        alt={origin}
        style={{ width: size, height: size }}
        onError={handleFaviconError}
      />
    </div>
  ) : (
    <Identicon
      hash={origin}
      size={size}
      className={classNames("shadow-xs", className)}
    />
  );
});
