import React, {
  ChangeEvent,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Modifier } from "@popperjs/core";
import BigNumber from "bignumber.js";
import classNames from "clsx";

import AssetField from "app/atoms/AssetField";
import DropdownWrapper from "app/atoms/DropdownWrapper";
import { ReactComponent as ChevronDownIcon } from "app/icons/chevron-down.svg";
import { ReactComponent as SearchIcon } from "app/icons/search.svg";
import { ReactComponent as SyncIcon } from "app/icons/sync.svg";
import AssetIcon from "app/templates/AssetIcon";
import { T } from "lib/i18n/react";
import {
  useAccount,
  useBalance,
  AssetIdentifier,
  getAssetId,
  matchesAsset,
  TempleAssetWithExchangeData,
  idsAreEqual,
} from "lib/temple/front";
import { TempleAsset, TempleAssetType } from "lib/temple/types";
import Popper, { PopperRenderProps } from "lib/ui/Popper";

export type SwapInputValue = {
  assetId: AssetIdentifier;
  amount?: BigNumber;
};

type SwapInputProps = {
  className?: string;
  balance?: BigNumber;
  max?: BigNumber;
  error?: string;
  name: string;
  assets: TempleAssetWithExchangeData[];
  defaultAsset?: TempleAssetWithExchangeData;
  amountReadOnly?: boolean;
  label: React.ReactNode;
  onChange?: (newValue: SwapInputValue) => void;
  onRefreshClick: () => void;
  value?: SwapInputValue;
  withPercentageButtons?: boolean;
};

const BUTTONS_PERCENTAGES = [25, 50, 75, 100];

const defaultInputValue: SwapInputValue = { assetId: {} };
const SwapInput = forwardRef<HTMLInputElement, SwapInputProps>(
  (
    {
      error,
      name,
      assets,
      balance,
      defaultAsset = assets[0],
      label,
      max = balance,
      onChange,
      onRefreshClick,
      withPercentageButtons,
      className,
      amountReadOnly,
      value = defaultInputValue,
    },
    ref
  ) => {
    const { assetId, amount } = value;
    const selectedAsset = useMemo(
      () =>
        assets.find((asset) => matchesAsset(assetId, asset)) || defaultAsset,
      [assetId, assets, defaultAsset]
    );
    const trueAssetId = useMemo(() => getAssetId(selectedAsset), [
      selectedAsset,
    ]);
    useEffect(() => {
      if (!idsAreEqual(assetId, trueAssetId)) {
        onChange?.({
          assetId: trueAssetId,
          amount,
        });
      }
    }, [amount, assetId, onChange, trueAssetId]);

    const [searchString, setSearchString] = useState("");

    const assetSuggestions = useMemo(() => {
      const searchRegex = new RegExp(searchString, "i");
      return assets.filter(({ symbol }) => searchRegex.test(symbol));
    }, [assets, searchString]);

    const handleSearchChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        setSearchString(e.target.value);
      },
      []
    );

    const handleAmountChange = useCallback(
      (value?: number) => {
        onChange?.({
          assetId,
          amount: value === undefined ? undefined : new BigNumber(value),
        });
      },
      [onChange, assetId]
    );

    const handlePercentageClick = useCallback(
      (percentage: number) => {
        const tokenElementaryParts = new BigNumber(10).pow(
          selectedAsset.decimals
        );
        onChange?.({
          assetId,
          amount: (max ?? new BigNumber(0))
            .multipliedBy(percentage)
            .multipliedBy(tokenElementaryParts)
            .dividedToIntegerBy(100)
            .dividedBy(tokenElementaryParts),
        });
      },
      [onChange, assetId, max, selectedAsset.decimals]
    );

    const handleSelectedAssetChange = useCallback(
      (newValue: AssetIdentifier) => {
        onChange?.({
          assetId: newValue,
          amount,
        });
        setSearchString("");
      },
      [onChange, amount]
    );

    return (
      <div className={classNames("w-full", className)}>
        <input className="hidden" name={name} ref={ref} />
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
              value={trueAssetId}
            />
          )}
        >
          {({ ref, opened, toggleOpened, setOpened }) => (
            <SwapInputHeader
              amount={amount}
              ref={(ref as unknown) as React.RefObject<HTMLDivElement>}
              toggleOpened={toggleOpened}
              opened={opened}
              setOpened={setOpened}
              label={label}
              onAmountChange={handleAmountChange}
              selectedAsset={selectedAsset}
              balance={balance}
              searchString={searchString}
              onSearchChange={handleSearchChange}
              onRefreshClick={onRefreshClick}
              amountReadOnly={amountReadOnly}
            />
          )}
        </Popper>
        {error && <div className="mt-1 text-red-700 text-xs">{error}</div>}
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
      </div>
    );
  }
);

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
      type="button"
      className="border border-gray-300 text-gray-500 rounded-md ml-1 p-1"
      onClick={handleClick}
    >
      {percentage === 100 ? <T id="max" /> : `${percentage}%`}
    </button>
  );
};

type SwapInputHeaderProps = PopperRenderProps &
  Pick<SwapInputProps, "amountReadOnly" | "label" | "onRefreshClick"> & {
    amount?: BigNumber;
    selectedAsset: TempleAssetWithExchangeData;
    balance?: BigNumber;
    onAmountChange: (value?: number) => void;
    searchString: string;
    onSearchChange: (e: ChangeEvent<HTMLInputElement>) => void;
  };

const SwapInputHeader = forwardRef<HTMLDivElement, SwapInputHeaderProps>(
  (
    {
      amount,
      opened,
      toggleOpened,
      selectedAsset,
      balance,
      label,
      onAmountChange,
      searchString,
      onRefreshClick,
      onSearchChange,
      amountReadOnly,
    },
    ref
  ) => {
    const amountFieldRef = useRef<HTMLInputElement>(null);

    const handleAmountFieldFocus = useCallback((evt) => {
      evt.preventDefault();
      amountFieldRef.current?.focus({ preventScroll: true });
    }, []);

    return (
      <div className="w-full text-gray-700" ref={ref}>
        <div className="w-full flex mb-1 items-center justify-between">
          <span className="text-xl text-gray-900">{label}</span>
          <span
            className={classNames(opened && "hidden", "text-xs text-gray-500")}
          >
            <span className="mr-1">
              <T id="balance" />
            </span>
            {balance && (
              <span
                className={classNames(
                  "text-sm mr-1 text-gray-700",
                  balance.eq(0) && "text-red-700"
                )}
              >
                {balance.toString()}
              </span>
            )}
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
            <SearchIcon className="w-6 h-auto text-gray-500 stroke-current stroke-2" />
          </div>
          <input
            className="mr-4 text-lg flex-1"
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
            className="border-r border-gray-300 pl-4 pr-3 flex py-5 cursor-pointer items-center"
            onClick={toggleOpened}
          >
            <AssetIcon asset={selectedAsset} size={32} className="mr-2" />
            <span
              className="text-gray-700 text-lg mr-2 items-center overflow-hidden block"
              style={{ textOverflow: "ellipsis", maxWidth: "6rem" }}
            >
              {selectedAsset.symbol}
            </span>
            <ChevronDownIcon className="w-4 h-auto text-gray-700 stroke-current stroke-2" />
          </div>
          <div className="flex-1 px-2 flex items-center justify-between">
            <button type="button" className="mr-2" onClick={onRefreshClick}>
              <SyncIcon className="w-4 h-auto text-gray-700 stroke-current stroke-2" />
            </button>
            <div className="h-full flex-1 flex items-end justify-center flex-col">
              <AssetField
                value={amount?.toNumber()}
                ref={amountFieldRef}
                onFocus={handleAmountFieldFocus}
                className={classNames(
                  "text-gray-700 text-2xl text-right border-none bg-opacity-0",
                  "pl-0 focus:shadow-none -mb-2"
                )}
                onChange={onAmountChange}
                style={{ padding: 0, borderRadius: 0 }}
                min={0}
                readOnly={amountReadOnly}
                assetDecimals={selectedAsset.decimals}
              />
              {amount !== undefined && selectedAsset.usdPrice !== undefined && (
                <span className="mt-2 text-xs text-gray-700">
                  ≈{" "}
                  {new BigNumber(amount)
                    .multipliedBy(selectedAsset.usdPrice)
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
  onChange: (newValue: AssetIdentifier) => void;
  options: TempleAsset[];
  value: AssetIdentifier;
};

const AssetsMenu: React.FC<AssetsMenuProps> = ({
  opened,
  setOpened,
  onChange,
  options,
  value,
}) => {
  const handleOptionClick = useCallback(
    (newValue: AssetIdentifier) => {
      if (!idsAreEqual(newValue, value)) {
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
  onClick: (newValue: AssetIdentifier) => void;
  isLast: boolean;
};

const AssetOption: React.FC<AssetOptionProps> = ({
  option,
  onClick,
  isLast,
}) => {
  const handleClick = useCallback(() => {
    onClick(getAssetId(option));
  }, [onClick, option]);
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
