import classNames from "clsx";
import React from "react";
import { T, t } from "lib/i18n/react";
import {
  TempleDAppPayload,
  TEZ_ASSET,
  tryParseExpenses,
  useAccount,
  TempleAssetType,
  useTokens,
} from "lib/temple/front";
import OperationsBanner from "app/templates/OperationsBanner";
import ViewsSwitcher from "app/templates/ViewsSwitcher";
import { ReactComponent as EyeIcon } from "app/icons/eye.svg";
import { ReactComponent as CodeAltIcon } from "app/icons/code-alt.svg";
import { ReactComponent as HashIcon } from "app/icons/hash.svg";
import RawPayloadView from "app/templates/RawPayloadView";
import ExpensesView from "app/templates/ExpensesView";

type OperationViewProps = {
  payload: TempleDAppPayload;
  networkRpc?: string;
};

const OperationView: React.FC<OperationViewProps> = ({
  payload,
  networkRpc,
}) => {
  const contentToParse = React.useMemo(() => {
    switch (payload.type) {
      case "confirm_operations":
        return (payload.rawToSign ?? payload.opParams) || [];
      case "sign":
        return payload.preview || [];
      default:
        return [];
    }
  }, [payload]);
  const account = useAccount();
  const { allTokens } = useTokens(networkRpc);

  const rawExpensesData = React.useMemo(
    () => tryParseExpenses(contentToParse, account.publicKeyHash),
    [contentToParse, account.publicKeyHash]
  );
  const expensesData = React.useMemo(() => {
    return rawExpensesData.map(({ expenses, ...restRaw }) => ({
      expenses: expenses.map(({ tokenAddress, tokenId, ...restProps }) => ({
        asset: tokenAddress
          ? allTokens.find((token) =>
              token.type === TempleAssetType.FA2
                ? token.address === tokenAddress && token.id === tokenId
                : token.address === tokenAddress
            ) || tokenAddress
          : TEZ_ASSET,
        tokenAddress,
        tokenId,
        ...restProps,
      })),
      ...restRaw,
    }));
  }, [allTokens, rawExpensesData]);

  const signPayloadFormats = React.useMemo(() => {
    const rawFormat = {
      key: "raw",
      name: t("raw"),
      Icon: CodeAltIcon,
    };
    const someExpenses =
      expensesData.reduce(
        (sum, operationExpenses) => sum + operationExpenses.expenses.length,
        0
      ) > 0;
    const prettyViewFormats = someExpenses
      ? [
          {
            key: "preview",
            name: t("preview"),
            Icon: EyeIcon,
          },
        ]
      : [];

    if (payload.type === "confirm_operations") {
      return [
        ...prettyViewFormats,
        rawFormat,
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

    if (payload.type === "connect") {
      return [];
    }

    return [
      ...prettyViewFormats,
      rawFormat,
      {
        key: "bytes",
        name: t("bytes"),
        Icon: HashIcon,
      },
    ];
  }, [payload, expensesData]);

  const [spFormat, setSpFormat] = React.useState(signPayloadFormats[0]);

  if (payload.type === "sign" && payload.preview) {
    return (
      <div className="flex flex-col w-full">
        <h2
          className={classNames("mb-3", "leading-tight", "flex items-center")}
        >
          <T id="payloadToSign">
            {(message) => (
              <span
                className={classNames(
                  "mr-2",
                  "text-base font-semibold text-gray-700"
                )}
              >
                {message}
              </span>
            )}
          </T>

          <div className="flex-1" />

          <ViewsSwitcher
            activeItem={spFormat}
            items={signPayloadFormats}
            onChange={setSpFormat}
          />
        </h2>

        <OperationsBanner
          opParams={payload.preview}
          className={classNames(spFormat.key !== "raw" && "hidden")}
          jsonViewStyle={{ height: "9.5rem" }}
        />

        <RawPayloadView
          payload={payload.payload}
          rows={6}
          className={classNames(spFormat.key !== "bytes" && "hidden")}
          style={{ marginBottom: 0 }}
          fieldWrapperBottomMargin={false}
        />

        <div className={classNames(spFormat.key !== "preview" && "hidden")}>
          <ExpensesView expenses={expensesData} />
        </div>
      </div>
    );
  }

  if (payload.type === "sign") {
    return (
      <RawPayloadView
        label={t("payloadToSign")}
        rows={6}
        payload={payload.payload}
        style={{ marginBottom: 0 }}
        fieldWrapperBottomMargin={false}
      />
    );
  }

  if (payload.type === "confirm_operations") {
    return (
      <div className="flex flex-col w-full">
        <h2
          className={classNames("mb-3", "leading-tight", "flex items-center")}
        >
          <span
            className={classNames(
              "mr-2",
              "text-base font-semibold text-gray-700"
            )}
          >
            <T id="operations" />
          </span>

          <div className="flex-1" />

          {signPayloadFormats.length > 1 && (
            <ViewsSwitcher
              activeItem={spFormat}
              items={signPayloadFormats}
              onChange={setSpFormat}
            />
          )}
        </h2>

        {payload.bytesToSign && (
          <RawPayloadView
            payload={payload.bytesToSign}
            rows={6}
            className={classNames(spFormat.key !== "bytes" && "hidden")}
            style={{ marginBottom: 0 }}
            fieldWrapperBottomMargin={false}
          />
        )}

        <OperationsBanner
          opParams={payload.rawToSign ?? payload.opParams}
          className={classNames(spFormat.key !== "raw" && "hidden")}
          jsonViewStyle={
            signPayloadFormats.length > 1 ? { height: "9.5rem" } : undefined
          }
          label={null}
        />

        <div className={classNames(spFormat.key !== "preview" && "hidden")}>
          <ExpensesView expenses={expensesData} />
        </div>
      </div>
    );
  }

  return null;
};

export default OperationView;
