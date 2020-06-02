import * as React from "react";
import classNames from "clsx";
import { useForm } from "react-hook-form";
import { useLocation } from "lib/woozie";
import {
  useThanosClient,
  useAccount,
  useAllNetworks,
  useAllAccounts,
  ThanosAccountType,
} from "lib/thanos/front";
import {
  ThanosDAppNetwork,
  ThanosDAppMetadata,
} from "@thanos-wallet/dapp/dist/types";
import Unlock from "app/pages/Unlock";
import ContentContainer from "app/layouts/ContentContainer";
import AccountBanner from "app/templates/AccountBanner";
import Logo from "app/atoms/Logo";
import Identicon from "app/atoms/Identicon";
import Name from "app/atoms/Name";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import FormField from "app/atoms/FormField";
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
          <ConfirmDAppForm />
        </ContentContainer>
      ) : (
        <Unlock canImportNew={false} />
      ),
    [ready]
  );
};

export default ConfirmPage;

interface PayloadBase {
  type: string;
  origin: string;
  network: ThanosDAppNetwork;
  appMeta: ThanosDAppMetadata;
}

interface ConnectPayload extends PayloadBase {
  type: "connect";
}

interface OperationsPayload extends PayloadBase {
  type: "confirm_operations";
  sourcePkh: string;
  opParams: any[];
}

type Payload = ConnectPayload | OperationsPayload;

type FormData = {
  password?: string;
};

const SUBMIT_ERROR_TYPE = "submit-error";

const ConfirmDAppForm: React.FC = () => {
  const { confirmDAppPermission, confirmDAppOperation } = useThanosClient();
  const allNetworks = useAllNetworks();
  const allAccounts = useAllAccounts();
  const account = useAccount();

  const [accountPkhToConnect, setAccountPkhToConnect] = React.useState(
    account.publicKeyHash
  );
  const connectedAccount = React.useMemo(
    () => allAccounts.find((a) => a.publicKeyHash === accountPkhToConnect)!,
    [allAccounts, accountPkhToConnect]
  );

  const loc = useLocation();
  const params = React.useMemo(() => {
    const usp = new URLSearchParams(loc.search);
    const id = usp.get("id")!;
    const payloadStr = usp.get("payload")!;
    const payload = JSON.parse(payloadStr) as Payload;
    return { id, ...payload };
  }, [loc.search]);

  const net = React.useMemo(
    () => allNetworks.find((n) => n.id === params.network)!,
    [allNetworks, params.network]
  );

  const content = React.useMemo(() => {
    switch (params.type) {
      case "connect":
        return {
          title: "Confirm connection",
          actionTitle: "Connect",
          want: (
            <p className="mb-2 text-sm text-gray-700 text-center">
              <span className="font-semibold">{params.origin}</span>
              <br />
              would like to connect to your wallet
            </p>
          ),
        };

      case "confirm_operations":
        return {
          title: "Confirm operations",
          actionTitle: "Confirm",
          want: (
            <p className="mb-2 text-sm text-gray-700 text-center">
              <div className="flex items-center justify-center">
                <Identicon
                  hash={params.origin}
                  size={16}
                  className="mr-1 shadow-xs"
                />
                <Name className="font-semibold" style={{ maxWidth: "7.5rem" }}>
                  {params.appMeta.name}
                </Name>
              </div>
              requests operations to you
            </p>
          ),
        };
    }
  }, [params.type, params.origin, params.appMeta.name]);

  const done = React.useCallback(
    (confimed: boolean, password?: string) => {
      switch (params.type) {
        case "connect":
          return confirmDAppPermission(
            params.id,
            confimed,
            accountPkhToConnect
          );

        case "confirm_operations":
          return confirmDAppOperation(params.id, confimed, password);
      }
    },
    [
      params.id,
      params.type,
      confirmDAppPermission,
      confirmDAppOperation,
      accountPkhToConnect,
    ]
  );

  const rootRef = React.useRef<HTMLFormElement>(null);

  const focusPasswordField = React.useCallback(() => {
    rootRef.current
      ?.querySelector<HTMLInputElement>("input[name='password']")
      ?.focus();
  }, []);

  React.useLayoutEffect(() => {
    const t = setTimeout(focusPasswordField, 100);
    return () => clearTimeout(t);
  }, [focusPasswordField]);

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
    async ({ password }: FormData) => {
      if (submitting) return;
      clearError("password");

      try {
        await done(true, password);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

        // Human delay.
        await new Promise((res) => setTimeout(res, 300));
        setError("password", SUBMIT_ERROR_TYPE, err.message);
        focusPasswordField();
      }
    },
    [submitting, clearError, setError, done, focusPasswordField]
  );

  const handleCancelClick = React.useCallback(async () => {
    if (submitting) return;
    clearError("password");

    try {
      await done(false);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error(err);
      }

      // Human delay.
      await new Promise((res) => setTimeout(res, 300));
      setError("password", SUBMIT_ERROR_TYPE, err.message);
    }
  }, [submitting, clearError, setError, done]);

  return (
    <form
      ref={rootRef}
      className={classNames(
        "relative bg-white rounded-md shadow overflow-y-auto",
        "flex flex-col"
      )}
      style={{
        width: 380,
        height: 578,
      }}
      onSubmit={handleSubmit(onSubmit)}
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
          className={params.type === "connect" ? "mt-4 mb-6" : "mt-4 mb-2"}
        >
          {content.title}
        </SubTitle>

        {params.type === "connect" && (
          <ConnectBanner
            type={params.type}
            origin={params.origin}
            appMeta={params.appMeta}
            className="mb-4"
          />
        )}

        {content.want}

        {params.type === "connect" && (
          <p className="mb-4 text-xs font-light text-gray-700 text-center">
            This site is requesting access to view your account address. Always
            make sure you trust the sites you interact with.
          </p>
        )}

        {params.type === "confirm_operations" && (
          <AccountBanner
            account={connectedAccount}
            displayBalance={false}
            label={null}
            className="w-full mb-2"
          />
        )}

        <div className={classNames("w-full", "mb-2", "flex flex-col")}>
          <h2 className={classNames("leading-tight", "flex flex-col")}>
            {params.type === "connect" && (
              <span className="mb-1 text-base font-semibold text-gray-700">
                Network
              </span>
            )}

            <div className={classNames("mb-1", "flex items-center")}>
              <div
                className={classNames(
                  "mr-1 w-3 h-3",
                  "border border-primary-white",
                  "rounded-full",
                  "shadow-xs"
                )}
                style={{ backgroundColor: net.color }}
              />

              <span className="text-gray-700 text-sm">{net.name}</span>
            </div>

            {/* <div className="my-1">
                <div className={classNames("mb-1", "flex items-center")}>
                  <div
                    className={classNames(
                      "flex-shrink-0",
                      "mr-1 w-3 h-3",
                      "bg-red-500",
                      "border border-primary-white",
                      "rounded-full",
                      "shadow-xs"
                    )}
                  />

                  <span className="text-gray-700 text-sm flex items-center">
                    Custom (<Name>{net.name!}</Name>)
                  </span>
                </div>

                <Name
                  className="text-xs font-mono italic"
                  style={{ maxWidth: "100%" }}
                >
                  {net.rpcUrl!}
                </Name>
              </div> */}
          </h2>
        </div>

        {params.type === "confirm_operations" && (
          <>
            <h2
              className={classNames(
                "w-full mb-2",
                "text-base font-semibold leading-tight",
                "text-gray-700"
              )}
            >
              Operations
            </h2>

            <div
              className={classNames(
                "w-full max-w-full mb-4",
                "rounded-md overflow-auto",
                "border-2 bg-gray-100",
                "flex flex-col",
                "text-gray-700 text-sm leading-tight"
              )}
              style={{
                maxHeight: "8rem",
              }}
            >
              <pre>{JSON.stringify(params.opParams, undefined, 2)}</pre>
            </div>
          </>
        )}

        {params.type === "connect" && (
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

            <div
              className={classNames(
                "rounded-md overflow-y-auto",
                "border-2 bg-gray-100",
                "flex flex-col",
                "text-gray-700 text-sm leading-tight"
              )}
              style={{
                maxHeight: "8rem",
              }}
            >
              {allAccounts.map((acc, i, arr) => {
                const last = i === arr.length - 1;
                const selected = accountPkhToConnect === acc.publicKeyHash;
                const handleAccountClick = () => {
                  setAccountPkhToConnect(acc.publicKeyHash);
                };

                return (
                  <button
                    key={acc.publicKeyHash}
                    type="button"
                    className={classNames(
                      "w-full flex-shrink-0",
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
                    autoFocus={selected}
                    onClick={handleAccountClick}
                  >
                    <Identicon
                      type="bottts"
                      hash={acc.publicKeyHash}
                      size={32}
                      className="flex-shrink-0 shadow-xs"
                    />

                    <div className="ml-2 flex flex-col items-start">
                      <div className="flex flex-wrap items-center">
                        <Name className="text-sm font-medium leading-tight">
                          {acc.name}
                        </Name>

                        {acc.type === ThanosAccountType.Imported && (
                          <span
                            className={classNames(
                              "ml-2",
                              "rounded-sm",
                              "border border-black-25",
                              "px-1 py-px",
                              "leading-tight",
                              "text-black-50"
                            )}
                            style={{ fontSize: "0.6rem" }}
                          >
                            Imported
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center">
                        <div
                          className={classNames(
                            "text-xs leading-none",
                            "text-gray-700"
                          )}
                        >
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
                      </div>
                    </div>

                    <div className="flex-1" />

                    {selected && (
                      <OkIcon
                        className={classNames("mx-2 h-5 w-auto stroke-2")}
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
        )}

        {params.type === "confirm_operations" && (
          <FormField
            ref={register({ required: "Required" })}
            label="Password"
            labelDescription="Enter passwrod to confirm operations"
            id="unlock-password"
            type="password"
            name="password"
            placeholder="********"
            errorCaption={errors.password && errors.password.message}
          />
        )}
      </div>

      <div className="flex-1" />

      <div
        className={classNames(
          "sticky bottom-0 w-full",
          "bg-white shadow-md",
          "flex items-strech",
          "px-4 pt-2 pb-4"
        )}
      >
        <div className="w-1/2 pr-2">
          <FormSecondaryButton
            type="button"
            className="w-full justify-center"
            onClick={handleCancelClick}
          >
            Cancel
          </FormSecondaryButton>
        </div>

        <div className="w-1/2 pl-2">
          <FormSubmitButton
            className="w-full justify-center"
            loading={submitting}
            disabled={submitting}
          >
            {content.actionTitle}
          </FormSubmitButton>
        </div>
      </div>
    </form>
  );
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
        <Identicon
          hash={origin}
          size={32}
          className="mb-1 flex-shrink-0 shadow-xs"
        />

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
            <Icon className="h-4 w-auto stroke-2 stroke-current" />
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
    <span className="text-gray-500 px-1">
      <ComponentIcon className="h-5 w-auto stroke-current" />
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
