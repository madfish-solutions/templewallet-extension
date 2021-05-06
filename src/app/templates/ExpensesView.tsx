import React, { FC, Fragment, memo, useMemo } from "react";

import { Estimate } from "@taquito/taquito/dist/types/contract/estimate";
import BigNumber from "bignumber.js";
import classNames from "clsx";

import Identicon from "app/atoms/Identicon";
import Money from "app/atoms/Money";
import { ReactComponent as ClipboardIcon } from "app/icons/clipboard.svg";
import HashChip from "app/templates/HashChip";
import InUSD from "app/templates/InUSD";
import { T, t, TProps } from "lib/i18n/react";
import {
  TempleAsset,
  RawOperationExpenses,
  RawOperationAssetExpense,
  TEZ_ASSET,
  mutezToTz,
} from "lib/temple/front";

type OperationAssetExpense = Omit<RawOperationAssetExpense, "tokenAddress"> & {
  asset: TempleAsset | string;
};

type OperationExpenses = Omit<RawOperationExpenses, "expenses"> & {
  expenses: OperationAssetExpense[];
};

type ExpensesViewProps = {
  expenses?: OperationExpenses[];
  estimates?: Estimate[];
  mainnet?: boolean;
  totalFeeDisplayed?: boolean;
  modifiedStorageLimit?: number;
};

const ExpensesView: FC<ExpensesViewProps> = ({
  expenses,
  estimates,
  mainnet,
  totalFeeDisplayed,
  modifiedStorageLimit,
}) => {
  const totalFee = useMemo(() => {
    if (!totalFeeDisplayed) return null;

    if (estimates) {
      let gasFeeMutez = new BigNumber(0);
      let storageFeeMutez = new BigNumber(0);
      try {
        let i = 0;
        for (const e of estimates) {
          gasFeeMutez = gasFeeMutez.plus(e.suggestedFeeMutez);
          storageFeeMutez = storageFeeMutez.plus(
            Math.ceil(
              (i === 0
                ? modifiedStorageLimit ?? e.storageLimit
                : e.storageLimit) * (e as any).minimalFeePerStorageByteMutez
            )
          );
          i++;
        }
      } catch {
        return null;
      }

      const gasFee = mutezToTz(gasFeeMutez);
      const storageFee = mutezToTz(storageFeeMutez);

      return (
        <div className="w-full flex flex-col">
          {[
            { key: "gas", title: t("gasFee"), fee: gasFee },
            {
              key: "storage",
              title: t("storageFeeMax"),
              fee: storageFee,
            },
          ].map(({ key, title, fee }) => (
            <div key={key} className="mb-px w-full flex items-center">
              <div
                className={classNames(
                  "mr-1",
                  "whitespace-no-wrap overflow-x-auto no-scrollbar",
                  "opacity-90"
                )}
                style={{ maxWidth: "40%" }}
              >
                {title}:
              </div>
              <div className="flex-1" />
              <div className="font-medium mr-1">
                <Money>{fee}</Money> ꜩ
              </div>
              <InUSD
                volume={fee}
                roundingMode={BigNumber.ROUND_UP}
                mainnet={mainnet}
              >
                {(usdAmount) => (
                  <div>
                    <span className="opacity-75">(</span>
                    <span className="pr-px">$</span>
                    {usdAmount}
                    <span className="opacity-75">)</span>
                  </div>
                )}
              </InUSD>
            </div>
          ))}
        </div>
      );
    }

    return null;
  }, [totalFeeDisplayed, estimates, mainnet, modifiedStorageLimit]);

  if (!expenses) {
    return null;
  }

  return (
    <div
      className={classNames(
        "relative rounded-md overflow-y-auto border",
        "flex flex-col text-gray-700 text-sm leading-tight"
      )}
      style={{ height: "9.5rem" }}
    >
      {expenses.map((item, index, arr) => (
        <ExpenseViewItem
          key={index}
          item={item}
          last={index === arr.length - 1}
          mainnet={mainnet}
        />
      ))}

      {totalFeeDisplayed && (
        <>
          <div className="flex-1" />

          <div
            className={classNames(
              "sticky bottom-0 left-0 right-0",
              "flex items-center",
              "px-2 py-1",
              "bg-gray-200 bg-opacity-90 border-t",
              "text-sm text-gray-700"
            )}
          >
            {totalFee ?? (
              <span>
                <T id="txIsLikelyToFail" />
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ExpensesView;

type ExpenseViewItemProps = {
  item: OperationExpenses;
  last: boolean;
  mainnet?: boolean;
};

const ExpenseViewItem: FC<ExpenseViewItemProps> = ({ item, last, mainnet }) => {
  const operationTypeLabel = useMemo(() => {
    switch (item.type) {
      // TODO: add translations for other operations types
      case "transaction":
      case "transfer":
        return `↑ ${t("transfer")}`;
      case "approve":
        return t("approveToken");
      case "delegation":
        return item.delegate ? t("delegation") : t("undelegation");
      default:
        return item.isEntrypointInteraction ? (
          <>
            <ClipboardIcon className="mr-1 h-3 w-auto stroke-current inline align-text-top" />
            <T id="interaction" />
          </>
        ) : (
          t("transactionOfSomeType", item.type)
        );
    }
  }, [item]);

  const { iconHash, iconType, argumentDisplayProps } = useMemo<{
    iconHash: string;
    iconType: "bottts" | "jdenticon";
    argumentDisplayProps?: OperationArgumentDisplayProps;
  }>(() => {
    const receivers = [
      ...new Set(
        item.expenses
          .map(({ to }) => to)
          .filter((value) =>
            item.contractAddress ? value !== item.contractAddress : !!value
          )
      ),
    ];

    switch (item.type) {
      case "transaction":
      case "transfer":
        return {
          iconHash: item.expenses[0]?.to || "unknown",
          iconType: "bottts",
          argumentDisplayProps: {
            i18nKey: "transferToSmb",
            arg: receivers,
          },
        };

      case "approve":
        return {
          iconHash: item.expenses[0]?.to || "unknown",
          iconType: "jdenticon",
          argumentDisplayProps: {
            i18nKey: "approveForSmb",
            arg: receivers,
          },
        };

      case "delegation":
        if (item.delegate) {
          return {
            iconHash: item.delegate,
            iconType: "bottts",
            argumentDisplayProps: {
              i18nKey: "delegationToSmb",
              arg: [item.delegate],
            },
          };
        }

        return {
          iconHash: "none",
          iconType: "jdenticon",
        };

      default:
        return item.isEntrypointInteraction
          ? {
              iconHash: item.contractAddress!,
              iconType: "jdenticon",
              argumentDisplayProps: {
                i18nKey: "interactionWithContract",
                arg: [item.contractAddress!],
              },
            }
          : {
              iconHash: "unknown",
              iconType: "jdenticon",
            };
    }
  }, [item]);

  const withdrawal = useMemo(
    () => ["transaction", "transfer"].includes(item.type),
    [item.type]
  );

  return (
    <div
      className={classNames(
        "pt-3 pb-2 px-2 flex items-stretch",
        !last && "border-b border-gray-200"
      )}
    >
      <div className="mr-2">
        <Identicon
          hash={iconHash}
          type={iconType}
          size={40}
          className="shadow-xs"
        />
      </div>

      <div className="flex-1 flex-col">
        <div className="mb-1 flex items-center">
          <div className="mr-1 flex items-center text-xs text-blue-600 opacity-75">
            {operationTypeLabel}
          </div>

          {argumentDisplayProps && (
            <OperationArgumentDisplay {...argumentDisplayProps} />
          )}
        </div>

        <div
          className={classNames(
            "flex items-end flex-shrink-0",
            "text-gray-800"
          )}
        >
          {item.expenses
            .filter((expense) => new BigNumber(expense.amount).isGreaterThan(0))
            .map((expense, index, arr) => (
              <Fragment key={index}>
                <OperationVolumeDisplay
                  expense={expense}
                  volume={item.amount}
                  withdrawal={withdrawal}
                  mainnet={mainnet}
                />
                {index === arr.length - 1 ? null : ", "}
              </Fragment>
            ))}

          {item.expenses.length === 0 &&
          item.amount &&
          new BigNumber(item.amount).isGreaterThan(0) ? (
            <OperationVolumeDisplay volume={item.amount!} mainnet={mainnet} />
          ) : null}
        </div>
      </div>
    </div>
  );
};

type OperationArgumentDisplayProps = {
  i18nKey: TProps["id"];
  arg: string[];
};

const OperationArgumentDisplay = memo<OperationArgumentDisplayProps>(
  ({ i18nKey, arg }) => (
    <span className="font-light text-gray-500 text-xs">
      <T
        id={i18nKey}
        substitutions={arg.map((value, index) => (
          <>
            <HashChip
              className="text-blue-600 opacity-75"
              key={index}
              hash={value}
              type="link"
            />
            {index === arg.length - 1 ? null : ", "}
          </>
        ))}
      />
    </span>
  )
);

type OperationVolumeDisplayProps = {
  expense?: OperationAssetExpense;
  volume?: number;
  withdrawal?: boolean;
  mainnet?: boolean;
};

const OperationVolumeDisplay = memo<OperationVolumeDisplayProps>(
  ({ expense, volume, mainnet }) => {
    const asset =
      typeof expense?.asset === "object" ? expense.asset : undefined;

    const finalVolume = expense
      ? expense.amount.div(10 ** (asset?.decimals || 0))
      : volume;

    return (
      <>
        <div className="text-sm">
          {/* {withdrawal && "-"} */}
          <span className="font-medium">
            <Money>{finalVolume || 0}</Money>
          </span>{" "}
          {expense?.asset ? asset?.symbol || "???" : "ꜩ"}
        </div>

        {(!expense?.asset || asset) && (
          <InUSD
            volume={finalVolume || 0}
            asset={asset || TEZ_ASSET}
            mainnet={mainnet}
          >
            {(usdVolume) => (
              <div className="text-xs text-gray-500 ml-1">
                (<span className="mr-px">$</span>
                {usdVolume})
              </div>
            )}
          </InUSD>
        )}
      </>
    );
  }
);
