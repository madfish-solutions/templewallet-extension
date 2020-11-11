import React from "react";
import {
  ThanosAsset,
  RawOperationExpenses,
  RawOperationAssetExpense,
} from "lib/thanos/front";
import { T, t } from "lib/i18n/react";
import CustomSelect, { OptionRenderProps } from "app/templates/CustomSelect";
import Money from "app/atoms/Money";
import Identicon from "app/atoms/Identicon";
import HashShortView from "app/atoms/HashShortView";
import { getAssetIconUrl } from "app/defaults";

type OperationAssetExpense = Omit<RawOperationAssetExpense, "tokenAddress"> & {
  asset: ThanosAsset | string;
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
    <CustomSelect
      items={expenses}
      className="h-40"
      OptionContent={ExpenseViewContent}
    />
  );
};

const ExpenseViewContent: React.FC<OptionRenderProps<OperationExpenses>> = ({
  item,
  index,
}) => {
  const operationTypeLabel = React.useMemo(() => {
    switch (item.type) {
      // TODO: add translations for other operations types
      case "transaction":
      case "transfer":
        return t("transfer");
      case "approve":
        return t("approveToken");
      case "delegation":
        return t("delegation");
      default:
        return item.isEntrypointInteraction
          ? t("interactionWithSomeEntrypoint", [
              item.type,
              <HashShortView hash={item.contractAddress!} />,
            ])
          : t("transactionOfSomeType", item.type);
    }
  }, [item]);
  return (
    <>
      <p className="text-xs text-gray-700">
        {index + 1}. {operationTypeLabel}
      </p>
      <div className="flex flex-col">
        {item.expenses.map(({ asset, amount }, index) => (
          <div className="mt-2 flex flex-wrap items-center" key={index}>
            {typeof asset === "string" ? (
              <>
                <Identicon className="h-8 w-auto mr-2" size={32} hash={asset} />
                <span className="text-xl text-gray-700">
                  <Money>{amount}</Money>{" "}
                  <span className="text-base">
                    (
                    <T
                      id="someUnknownToken"
                      substitutions={<HashShortView hash={asset} />}
                    />
                    )
                  </span>
                </span>
              </>
            ) : (
              <>
                <img
                  className="h-8 w-auto mr-2"
                  alt={asset.symbol}
                  src={getAssetIconUrl(asset)}
                />
                <span className="text-xl text-gray-700">
                  <Money>{amount.div(10 ** asset.decimals)}</Money>{" "}
                  <span className="text-base">{asset.symbol}</span>
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export default ExpensesView;
