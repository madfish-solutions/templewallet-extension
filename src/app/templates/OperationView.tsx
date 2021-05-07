import React, { FC, useMemo, useState } from "react";

import classNames from "clsx";

import { ReactComponent as CodeAltIcon } from "app/icons/code-alt.svg";
import { ReactComponent as EyeIcon } from "app/icons/eye.svg";
import { ReactComponent as HashIcon } from "app/icons/hash.svg";
import ExpensesView from "app/templates/ExpensesView";
import OperationsBanner from "app/templates/OperationsBanner";
import RawPayloadView from "app/templates/RawPayloadView";
import ViewsSwitcher from "app/templates/ViewsSwitcher";
import { T, t } from "lib/i18n/react";
import {
  TEZ_ASSET,
  tryParseExpenses,
  TempleAssetType,
  useTokens,
  TempleDAppOperationsPayload,
  TempleDAppSignPayload,
} from "lib/temple/front";

type OperationViewProps = {
  payload: TempleDAppOperationsPayload | TempleDAppSignPayload;
  networkRpc?: string;
  mainnet?: boolean;
  increaseStorageFee?: number;
};

const OperationView: FC<OperationViewProps> = ({
  payload,
  networkRpc,
  mainnet = false,
  increaseStorageFee,
}) => {
  const contentToParse = useMemo(() => {
    switch (payload.type) {
      case "confirm_operations":
        return (payload.rawToSign ?? payload.opParams) || [];
      case "sign":
        return payload.preview || [];
      default:
        return [];
    }
  }, [payload]);
  const { allTokens } = useTokens(networkRpc);

  const rawExpensesData = useMemo(
    () => tryParseExpenses(contentToParse, payload.sourcePkh),
    [contentToParse, payload.sourcePkh]
  );

  const expensesData = useMemo(() => {
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

  const signPayloadFormats = useMemo(() => {
    const rawFormat = {
      key: "raw",
      name: t("raw"),
      Icon: CodeAltIcon,
    };
    const prettyViewFormats = [
      {
        key: "preview",
        name: t("preview"),
        Icon: EyeIcon,
      },
    ];

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

    return [
      ...(rawExpensesData.length > 0 ? prettyViewFormats : []),
      rawFormat,
      {
        key: "bytes",
        name: t("bytes"),
        Icon: HashIcon,
      },
    ];
  }, [payload, rawExpensesData]);

  const [spFormat, setSpFormat] = useState(signPayloadFormats[0]);

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
          className={classNames(spFormat.key !== "bytes" && "hidden")}
          style={{ marginBottom: 0, height: "9.5rem" }}
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
        payload={payload.payload}
        style={{ marginBottom: 0, height: "9.5rem" }}
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
            className={classNames(spFormat.key !== "bytes" && "hidden")}
            style={{ marginBottom: 0, height: "9.5rem" }}
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
          <ExpensesView
            expenses={expensesData}
            estimates={payload.estimates}
            increaseStorageFee={increaseStorageFee}
            mainnet={mainnet}
            totalFeeDisplayed
          />
        </div>
      </div>
    );
  }

  return null;
};

export default OperationView;
