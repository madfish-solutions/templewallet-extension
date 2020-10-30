import classNames from "clsx";
import React from "react";
import { T, t } from "lib/i18n/react";
import {
  ThanosAsset,
  ThanosDAppPayload,
  XTZ_ASSET,
  RawOperationExpenses,
  RawOperationAssetExpense,
  tryParseExpenses,
  useAccount,
  useAssets,
  ThanosAssetType,
} from "lib/thanos/front";
import CustomSelect, { OptionRenderProps } from "app/templates/CustomSelect";
import OperationsBanner from "app/templates/OperationsBanner";
import FormField from "app/atoms/FormField";
import Money from "app/atoms/Money";
import Identicon from "app/atoms/Identicon";
import HashShortView from "app/atoms/HashShortView";
import { ReactComponent as EyeIcon } from "app/icons/eye.svg";
import { ReactComponent as CodeAltIcon } from "app/icons/code-alt.svg";
import { ReactComponent as DollarIcon } from "app/icons/dollar.svg";
import { getAssetIconUrl } from "app/defaults";

type OperationAssetExpense = Omit<RawOperationAssetExpense, "tokenAddress"> & {
  asset: ThanosAsset | string;
};
type OperationExpenses = Omit<RawOperationExpenses, "expenses"> & {
  expenses: OperationAssetExpense[];
};

type OperationViewProps = {
  payload: ThanosDAppPayload;
};

const OperationView: React.FC<OperationViewProps> = (props) => {
  const { payload } = props;
  const contentToParse = React.useMemo(() => {
    switch (payload.type) {
      case "confirm_operations":
        return payload.opParams || [];
      case "sign":
        return payload.preview || [];
      default:
        return [];
    }
  }, [payload]);
  const account = useAccount();
  const { allAssets } = useAssets();

  const rawExpensesData = React.useMemo(
    () => tryParseExpenses(contentToParse, account.publicKeyHash),
    [contentToParse, account.publicKeyHash]
  );
  const expensesData = React.useMemo(() => {
    return rawExpensesData.map(({ expenses, ...restProps }) => ({
      expenses: expenses.map(({ tokenAddress, ...restProps }) => ({
        asset: tokenAddress
          ? allAssets.find(
              (asset) =>
                asset.type !== ThanosAssetType.XTZ &&
                asset.address === tokenAddress
            ) || tokenAddress
          : XTZ_ASSET,
        ...restProps,
      })),
      ...restProps,
    }));
  }, [allAssets, rawExpensesData]);

  const signPayloadFormats = React.useMemo(() => {
    const previewFormat = {
      key: "preview",
      name: t("preview"),
      Icon: EyeIcon,
    };
    const someExpenses =
      expensesData.reduce(
        (sum, operationExpenses) => sum + operationExpenses.expenses.length,
        0
      ) > 0;
    const prettyViewFormats = [
      someExpenses
        ? {
            key: "expenses",
            name: t("expenses"),
            Icon: DollarIcon,
          }
        : undefined,
    ].filter((item): item is ViewsSwitcherItemProps => !!item);

    if (payload.type === "confirm_operations") {
      return [...prettyViewFormats, previewFormat];
    }

    if (payload.type === "connect") {
      return [];
    }

    return [
      ...prettyViewFormats,
      previewFormat,
      {
        key: "raw",
        name: t("raw"),
        Icon: CodeAltIcon,
      },
    ];
  }, [payload.type, expensesData]);

  const [spFormat, setSpFormat] = React.useState(signPayloadFormats[0]);

  if (payload.type === "sign" && payload.preview) {
    return (
      <div className="flex flex-col w-full">
        <h2
          className={classNames("mb-4", "leading-tight", "flex items-center")}
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
          label={null}
          className={classNames(spFormat.key !== "preview" && "hidden")}
        />

        <RawPayloadView
          payload={payload.payload}
          className={classNames(spFormat.key !== "raw" && "hidden")}
        />

        <div className={classNames(spFormat.key !== "expenses" && "hidden")}>
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
        className="mb-2"
      />
    );
  }

  if (payload.type === "confirm_operations") {
    return (
      <div className="flex flex-col w-full">
        <h2
          className={classNames("mb-4", "leading-tight", "flex items-center")}
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

        <OperationsBanner
          opParams={payload.opParams}
          className={classNames(spFormat.key !== "preview" && "hidden")}
          label={null}
        />

        <div className={classNames(spFormat.key !== "expenses" && "hidden")}>
          <ExpensesView expenses={expensesData} />
        </div>
      </div>
    );
  }

  return null;
};

export default OperationView;

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
      maxHeight="10rem"
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
        return t(
          item.isEntrypointInteraction
            ? "interactionWithSomeEntrypoint"
            : "transactionOfSomeType",
          item.type
        );
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

type RawPayloadViewProps = {
  label?: string;
  payload: string;
  className?: string;
};

const RawPayloadView = React.memo(
  ({ className, payload, label }: RawPayloadViewProps) => (
    <FormField
      textarea
      rows={6}
      id="sign-payload"
      label={label}
      value={payload}
      spellCheck={false}
      readOnly
      className={className}
      style={{
        resize: "none",
      }}
    />
  )
);

type ViewsSwitcherItemProps = {
  Icon: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  key: string;
  name: string;
};

type ViewsSwitcherProps = {
  activeItem: ViewsSwitcherItemProps;
  items: ViewsSwitcherItemProps[];
  onChange: (item: ViewsSwitcherItemProps) => void;
};

const ViewsSwitcher = React.memo(
  ({ activeItem, items, onChange }: ViewsSwitcherProps) => (
    <div className={classNames("flex items-center")}>
      {items.map((spf, i, arr) => {
        const first = i === 0;
        const last = i === arr.length - 1;
        const selected = activeItem.key === spf.key;
        const handleClick = () => onChange(spf);

        return (
          <button
            key={spf.key}
            className={classNames(
              (() => {
                switch (true) {
                  case first:
                    return classNames("rounded rounded-r-none", "border");

                  case last:
                    return classNames(
                      "rounded rounded-l-none",
                      "border border-l-0"
                    );

                  default:
                    return "border border-l-0";
                }
              })(),
              selected && "bg-gray-100",
              "px-2 py-1",
              "text-xs text-gray-600",
              "flex items-center"
            )}
            onClick={handleClick}
          >
            <spf.Icon
              className={classNames("h-4 w-auto mr-1", "stroke-current")}
            />
            {spf.name}
          </button>
        );
      })}
    </div>
  )
);
