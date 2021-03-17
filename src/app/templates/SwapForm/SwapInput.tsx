import BigNumber from "bignumber.js";
import classNames from "clsx";
import React, { ChangeEvent, useCallback, useMemo, useState } from "react";
import { FormContextValues, Controller } from "react-hook-form";
import { Modifier } from "@popperjs/core";
import { t } from "lib/i18n/react";
import { TempleAsset, TempleAssetType } from "lib/temple/types";
import { mutezToTz, TEZ_ASSET, useAccount, useBalance } from "lib/temple/front";
import Popper, { PopperRenderProps } from "lib/ui/Popper";
import AssetField from "app/atoms/AssetField";
import { ReactComponent as ChevronDownIcon } from "app/icons/chevron-down.svg";
import { ReactComponent as SearchIcon } from "app/icons/search.svg";
import { ReactComponent as SyncIcon } from "app/icons/sync.svg";
import AssetIcon from "app/templates/AssetIcon";
import DropdownWrapper from "app/atoms/DropdownWrapper";

type SwapInputProps = {
  assetInputName: string;
  amountInputName: string;
  assets: TempleAsset[];
  formContextValues: FormContextValues;
  amountReadOnly?: boolean;
  withPercentageButtons?: boolean;
  className?: string;
};

const DEXTER_REQUIRED_XTZ_RESERVE = 300000;
const BUTTONS_PERCENTAGES = [25, 50, 75, 100];

const SwapInput: React.FC<SwapInputProps> = ({
  assetInputName,
  amountInputName,
  assets,
  formContextValues,
  withPercentageButtons,
  className,
  amountReadOnly,
}) => {
  const { watch, setValue, errors } = formContextValues;
  const assetAddress = watch(assetInputName);
  const selectedAsset = useMemo(
    () =>
      assets.find((asset) => {
        if (asset.type === TempleAssetType.TEZ) {
          return !assetAddress;
        }
        return asset.address === assetAddress;
      }) || (assetAddress ? assets[0] : TEZ_ASSET),
    [assetAddress, assets]
  );
  const trueAssetAddress =
    selectedAsset.type === TempleAssetType.TEZ
      ? undefined
      : selectedAsset.address;
  React.useEffect(() => {
    if (assetAddress !== trueAssetAddress) {
      setValue(assetInputName, trueAssetAddress);
    }
  }, [setValue, assetAddress, trueAssetAddress, assetInputName]);

  const { publicKeyHash: accountPkh } = useAccount();
  const { data: balance } = useBalance(selectedAsset, accountPkh);
  const [searchString, setSearchString] = useState("");
  const [assetSuggestions, setAssetSuggestions] = useState(assets);

  const handleSearchChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newSearchString = e.target.value;
      setSearchString(newSearchString);
      const searchRegex = new RegExp(newSearchString, "i");
      setAssetSuggestions(
        assets.filter(({ symbol }) => searchRegex.test(symbol))
      );
    },
    [assets]
  );

  const handlePercentageClick = useCallback(
    (percentage: number) => {
      const maxAmount =
        selectedAsset.type === TempleAssetType.TEZ
          ? BigNumber.max(
              balance?.minus(mutezToTz(DEXTER_REQUIRED_XTZ_RESERVE)) ?? 0,
              0
            )
          : balance ?? new BigNumber(0);
      setValue(amountInputName, maxAmount.multipliedBy(percentage).div(100));
    },
    [setValue, amountInputName, balance, selectedAsset.type]
  );

  const handleSelectedAssetChange = useCallback(
    (newAssetAddress?: string) => {
      console.log("setValue", assetInputName, newAssetAddress);
      setValue(assetInputName, newAssetAddress);
    },
    [setValue, assetInputName]
  );

  return (
    <>
      <Popper
        placement="bottom"
        strategy="fixed"
        modifiers={[sameWidth]}
        popup={({ opened, setOpened }) => (
          <AssetsMenu
            opened={opened}
            setOpened={setOpened}
            onChange={handleSelectedAssetChange}
            options={assetSuggestions}
            value={trueAssetAddress}
          />
        )}
      >
        {({ ref, opened, toggleOpened, setOpened }) => (
          <SwapInputHeader
            ref={(ref as unknown) as React.RefObject<HTMLDivElement>}
            toggleOpened={toggleOpened}
            opened={opened}
            setOpened={setOpened}
            className={className}
            selectedAsset={selectedAsset}
            balance={balance!}
            searchString={searchString}
            onSearchChange={handleSearchChange}
            amountInputName={amountInputName}
            assetInputName={assetInputName}
            formContextValues={formContextValues}
            amountReadOnly={amountReadOnly}
          />
        )}
      </Popper>
      {errors[amountInputName] && (
        <div className="mt-1 text-red-700 text-xs">
          {errors[amountInputName].message}
        </div>
      )}
      {withPercentageButtons && (
        <div className="w-full flex justify-end mt-1">
          {BUTTONS_PERCENTAGES.map((percentage) => (
            <PercentageButton
              key={percentage}
              percentage={percentage}
              onClick={handlePercentageClick}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default SwapInput;

type PercentageButtonProps = {
  percentage: number;
  onClick: (percentage: number) => void;
};

const PercentageButton: React.FC<PercentageButtonProps> = ({
  percentage,
  onClick,
}) => {
  const handleClick = useCallback(() => onClick(percentage), [
    onClick,
    percentage,
  ]);

  return (
    <button
      className="border border-gray-300 text-gray-500 rounded-md ml-1 p-1"
      onClick={handleClick}
    >
      {percentage === 100 ? "Max" : `${percentage}%`}
    </button>
  );
};

type SwapInputHeaderProps = PopperRenderProps &
  Pick<
    SwapInputProps,
    | "className"
    | "formContextValues"
    | "amountInputName"
    | "amountReadOnly"
    | "assetInputName"
  > & {
    selectedAsset: TempleAsset;
    balance: BigNumber;
    searchString: string;
    onSearchChange: (e: ChangeEvent<HTMLInputElement>) => void;
  };

const dummyExchangeRate = new BigNumber("0.13");

const SwapInputHeader = React.forwardRef<HTMLDivElement, SwapInputHeaderProps>(
  (
    {
      assetInputName,
      className,
      formContextValues: { control, watch },
      opened,
      toggleOpened,
      selectedAsset,
      balance,
      searchString,
      onSearchChange,
      amountInputName,
      amountReadOnly,
    },
    ref
  ) => {
    const amount: BigNumber | undefined = watch(amountInputName);
    const amountFieldRef = React.useRef<HTMLInputElement>(null);

    const handleAmountFieldFocus = useCallback((evt) => {
      evt.preventDefault();
      amountFieldRef.current?.focus({ preventScroll: true });
    }, []);

    const handleAmountFieldControlFocus = useCallback(() => {
      amountFieldRef.current?.focus();
    }, []);

    const validateAmount = useCallback(
      (v?: number) => {
        if (v === undefined) return t("required");
        if (v === 0) {
          return t("amountMustBePositive");
        }
        const vBN = new BigNumber(v);
        const maxAmount =
          selectedAsset.type === TempleAssetType.TEZ
            ? BigNumber.max(
                balance.minus(mutezToTz(DEXTER_REQUIRED_XTZ_RESERVE)),
                0
              )
            : balance;
        return (
          vBN.isLessThanOrEqualTo(maxAmount) ||
          t("maximalAmount", maxAmount.toFixed())
        );
      },
      [balance, selectedAsset.type]
    );

    return (
      <div className={classNames("w-full text-gray-700", className)} ref={ref}>
        <div className="w-full flex mb-1 items-center justify-between">
          <span className="text-xl text-gray-900">From</span>
          <span
            className={classNames(opened && "hidden", "text-xs text-gray-500")}
          >
            <span className="mr-1">Balance:</span>
            <span
              className={classNames(
                "text-sm mr-1 text-gray-700",
                balance.eq(0) && "text-red-700"
              )}
            >
              {balance.toString()}
            </span>
            <span>{selectedAsset.symbol}</span>
          </span>
        </div>
        <div
          className={classNames(
            "w-full border rounded-md border-gray-300 flex items-stretch",
            !opened && "hidden"
          )}
        >
          <div className="items-center mx-5 my-6">
            <SearchIcon className="w-6 h-auto text-gray-300 stroke-current" />
          </div>
          <input
            className="mr-4"
            value={searchString}
            onChange={onSearchChange}
          />
        </div>
        <div
          className={classNames(
            "w-full border rounded-md border-gray-300 flex items-stretch",
            opened && "hidden"
          )}
        >
          <div
            className="border-r border-gray-300 pl-4 pr-3 flex py-5 cursor-pointer"
            onClick={toggleOpened}
          >
            <AssetIcon asset={selectedAsset} size={32} className="mr-2" />
            <span className="text-gray-700 text-lg mr-2 flex items-center">
              {selectedAsset.symbol}
            </span>
            <ChevronDownIcon className="w-4 h-auto text-gray-700 stroke-current stroke-2" />
            <Controller
              control={control}
              className="hidden"
              as="input"
              name={assetInputName}
            />
          </div>
          <div className="flex-1 px-2 flex items-center justify-between">
            <button type="button" className="mr-2">
              <SyncIcon className="w-4 h-auto text-gray-700 stroke-current" />
            </button>
            <div className="h-full flex-1 flex items-end justify-center flex-col">
              <Controller
                control={control}
                className={classNames(
                  "text-gray-700 text-2xl text-right border-none bg-opacity-0",
                  "pl-0 focus:shadow-none -mb-2"
                )}
                style={{ padding: 0 }}
                name={amountInputName}
                as={
                  <AssetField
                    ref={amountFieldRef}
                    onFocus={handleAmountFieldFocus}
                  />
                }
                rules={{ validate: validateAmount }}
                readOnly={amountReadOnly}
                onFocus={handleAmountFieldControlFocus}
                assetDecimals={selectedAsset.decimals}
              />
              {amount && (
                <span className="mt-2 text-xs text-gray-700">
                  ≈{" "}
                  {new BigNumber(amount)
                    .multipliedBy(dummyExchangeRate)
                    .toFormat(2, BigNumber.ROUND_DOWN)}
                  <span className="text-gray-500">{" $"}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

type AssetsMenuProps = {
  opened: boolean;
  setOpened: (newValue: boolean) => void;
  onChange: (newValue?: string) => void;
  options: TempleAsset[];
  value?: string;
};

const AssetsMenu: React.FC<AssetsMenuProps> = ({
  opened,
  setOpened,
  onChange,
  options,
  value,
}) => {
  const handleOptionClick = useCallback(
    (newValue?: string) => {
      if (newValue !== value) {
        onChange(newValue);
      }
      setOpened(false);
    },
    [onChange, setOpened, value]
  );

  return (
    <DropdownWrapper
      opened={opened}
      className="origin-top overflow-x-hidden overflow-y-auto"
      style={{
        maxHeight: "20rem",
        backgroundColor: "white",
        borderColor: "#e2e8f0",
        padding: 0,
      }}
    >
      {options.map((option, index) => (
        <AssetOption
          key={getAssetKey(option) ?? "tez"}
          option={option}
          selected={value === getAssetKey(option)}
          onClick={handleOptionClick}
          isLast={index === options.length - 1}
        />
      ))}
    </DropdownWrapper>
  );
};

type AssetOptionProps = {
  option: TempleAsset;
  selected: boolean;
  onClick: (newValue?: string) => void;
  isLast: boolean;
};

const AssetOption: React.FC<AssetOptionProps> = ({
  option,
  onClick,
  isLast,
}) => {
  const handleClick = useCallback(() => onClick(getAssetKey(option)), [
    onClick,
    option,
  ]);
  const { publicKeyHash: accountPkh } = useAccount();
  const { data: balance } = useBalance(option, accountPkh, { suspense: false });

  return (
    <button
      type="button"
      onClick={handleClick}
      className={classNames(
        !isLast && "border-b border-gray-300",
        "p-4 w-full flex items-center"
      )}
    >
      <AssetIcon asset={option} size={32} className="mr-2" />
      <span className="text-gray-700 text-lg mr-2">{option.symbol}</span>
      <div className="flex-1 text-right text-lg text-gray-600">
        {balance?.toString()}
      </div>
    </button>
  );
};

function getAssetKey(asset: TempleAsset) {
  return asset.type === TempleAssetType.TEZ ? undefined : asset.address;
}

const sameWidth: Modifier<string, any> = {
  name: "sameWidth",
  enabled: true,
  phase: "beforeWrite",
  requires: ["computeStyles"],
  fn: ({ state }) => {
    state.styles.popper.width = `${state.rects.reference.width}px`;
  },
  effect: ({ state }) => {
    state.elements.popper.style.width = `${
      (state.elements.reference as any).offsetWidth
    }px`;
    return () => {};
  },
};
