import classNames from "clsx";
import React from "react";
import {
  TempleAsset,
  RawOperationExpenses,
  RawOperationAssetExpense,
  TEZ_ASSET,
} from "lib/temple/front";
import { T, t, TProps } from "lib/i18n/react";
import Money from "app/atoms/Money";
import Identicon from "app/atoms/Identicon";
import HashChip from "app/templates/HashChip";
import InUSD from "app/templates/InUSD";
import { ReactComponent as ClipboardIcon } from "app/icons/clipboard.svg";

type OperationAssetExpense = Omit<RawOperationAssetExpense, "tokenAddress"> & {
  asset: TempleAsset | string;
};

type OperationExpenses = Omit<RawOperationExpenses, "expenses"> & {
  expenses: OperationAssetExpense[];
};

type ExpensesViewProps = {
  expenses?: OperationExpenses[];
};

const ExpensesView: React.FC<ExpensesViewProps> = (props) => {
  const { expenses } = props;

  if (!expenses) {
    return null;
  }

  return (
    <div
      className={classNames(
        "rounded-md overflow-y-auto border",
        "flex flex-col text-gray-700 text-sm leading-tight"
      )}
      style={{ height: "9.5rem" }}
    >
      {expenses.map((item, index, arr) => (
        <ExpenseViewItem
          key={index}
          item={item}
          last={index === arr.length - 1}
        />
      ))}
    </div>
  );
};

export default ExpensesView;

type ExpenseViewItemProps = {
  item: OperationExpenses;
  last: boolean;
};

const ExpenseViewItem: React.FC<ExpenseViewItemProps> = ({ item, last }) => {
  const operationTypeLabel = React.useMemo(() => {
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

  const { iconHash, iconType, argumentDisplayProps } = React.useMemo<{
    iconHash: string;
    iconType: "bottts" | "jdenticon";
    argumentDisplayProps?: OperationArgumentDisplayProps;
  }>(() => {
    const receivers = [
      ...new Set(item.expenses.map(({ to }) => to).filter((value) => !!value)),
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

  const withdrawal = React.useMemo(
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
          <div className="flex mr-1 text-xs items-center text-blue-600 opacity-75">
            {operationTypeLabel}
          </div>

          {argumentDisplayProps && (
            <OperationArgumentDisplay {...argumentDisplayProps} />
          )}
        </div>

        <div
          className={classNames(
            "flex items-end flex-shrink-0",
            (() => {
              switch (item.type) {
                case "transaction":
                case "transfer":
                  return "text-red-700";

                case "approve":
                  return "text-yellow-600";

                default:
                  return "text-gray-800";
              }
            })()
          )}
        >
          {item.expenses.map((expense, index) => (
            <React.Fragment key={index}>
              <OperationVolumeDisplay
                expense={expense}
                volume={item.amount}
                withdrawal={withdrawal}
              />
              {index === item.expenses.length - 1 ? null : ", "}
            </React.Fragment>
          ))}

          {item.expenses.length === 0 && (item.amount || undefined) && (
            <OperationVolumeDisplay volume={item.amount!} />
          )}
        </div>
      </div>
    </div>
  );
};

type OperationArgumentDisplayProps = {
  i18nKey: TProps["id"];
  arg: string[];
};

const OperationArgumentDisplay = React.memo<OperationArgumentDisplayProps>(
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
};

const OperationVolumeDisplay = React.memo<OperationVolumeDisplayProps>(
  ({ expense, volume, withdrawal }) => {
    const asset =
      typeof expense?.asset === "object" ? expense.asset : undefined;

    const finalVolume = expense
      ? expense.amount.div(10 ** (asset?.decimals || 0))
      : volume;

    return (
      <>
        <div className="text-sm">
          {withdrawal && "-"}
          <Money>{finalVolume || 0}</Money>{" "}
          {expense?.asset ? asset?.symbol || "???" : "ꜩ"}
        </div>

        {(!expense?.asset || asset) && (
          <InUSD volume={finalVolume || 0} asset={asset || TEZ_ASSET}>
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
