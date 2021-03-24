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
import { FormContextValues, Controller } from "react-hook-form";

import AssetField from "app/atoms/AssetField";
import DropdownWrapper from "app/atoms/DropdownWrapper";
import { ReactComponent as ChevronDownIcon } from "app/icons/chevron-down.svg";
import { ReactComponent as SearchIcon } from "app/icons/search.svg";
import { ReactComponent as SyncIcon } from "app/icons/sync.svg";
import AssetIcon from "app/templates/AssetIcon";
import { T, t } from "lib/i18n/react";
import {
  mutezToTz,
  useAccount,
  useBalance,
  AssetIdentifier,
  getAssetId,
  matchesAsset,
  TempleAssetWithExchangeData,
} from "lib/temple/front";
import { TempleAsset, TempleAssetType } from "lib/temple/types";
import Popper, { PopperRenderProps } from "lib/ui/Popper";

type FormValuesBase<
  AssetInputName extends string,
  AmountInputName extends string
> = Record<AssetInputName, AssetIdentifier> & Record<AmountInputName, number>;
type SwapInputProps<
  AssetInputName extends string,
  AmountInputName extends string,
  FormValues extends FormValuesBase<AssetInputName, AmountInputName>
> = {
  assetInputName: AssetInputName;
  amountInputName: AmountInputName;
  assets: TempleAssetWithExchangeData[];
  defaultAsset?: TempleAssetWithExchangeData;
  formContextValues: FormContextValues<FormValues>;
  amountReadOnly?: boolean;
  label: React.ReactNode;
  max?: BigNumber;
  onAssetChange: (newValue: AssetIdentifier) => void;
  onRefreshClick: () => void;
  withPercentageButtons?: boolean;
  className?: string;
};

const DEXTER_REQUIRED_XTZ_RESERVE = 300000;
const BUTTONS_PERCENTAGES = [25, 50, 75, 100];

const SwapInput = <
  AssetInputName extends string,
  AmountInputName extends string,
  FormValues extends FormValuesBase<AssetInputName, AmountInputName>
>({
  assetInputName,
  amountInputName,
  assets,
  defaultAsset = assets[0],
  formContextValues,
  label,
  max,
  onAssetChange,
  onRefreshClick,
  withPercentageButtons,
  className,
  amountReadOnly,
}: SwapInputProps<AssetInputName, AmountInputName, FormValues>) => {
  const { watch, setValue, errors } = formContextValues;
  const { address: assetAddress, tokenId: assetTokenId } = watch(
    assetInputName
  );
  const selectedAsset = useMemo(
    () =>
      assets.find((asset) =>
        matchesAsset({ address: assetAddress, tokenId: assetTokenId }, asset)
      ) || defaultAsset,
    [assetAddress, assetTokenId, assets, defaultAsset]
  );
  const { address: trueAssetAddress, tokenId: trueAssetTokenId } = useMemo(
    () => getAssetId(selectedAsset),
    [selectedAsset]
  );
  useEffect(() => {
    if (
      assetAddress !== trueAssetAddress ||
      assetTokenId !== trueAssetTokenId
    ) {
      // @ts-ignore
      setValue(assetInputName, {
        address: trueAssetAddress,
        tokenId: trueAssetTokenId,
      });
    }
  }, [
    setValue,
    assetAddress,
    trueAssetAddress,
    assetInputName,
    assetTokenId,
    trueAssetTokenId,
  ]);

  const { publicKeyHash: accountPkh } = useAccount();
  const { data: balance } = useBalance(selectedAsset, accountPkh);
  const [searchString, setSearchString] = useState("");

  const assetSuggestions = useMemo(() => {
    const searchRegex = new RegExp(searchString, "i");
    return assets.filter(({ symbol }) => searchRegex.test(symbol));
  }, [assets, searchString]);

  const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearchString(e.target.value);
  }, []);

  const handlePercentageClick = useCallback(
    (percentage: number) => {
      const maxAmount =
        selectedAsset.type === TempleAssetType.TEZ
          ? BigNumber.max(
              balance?.minus(mutezToTz(DEXTER_REQUIRED_XTZ_RESERVE)) ?? 0,
              0
            )
          : balance ?? new BigNumber(0);
      const tokenElementaryParts = new BigNumber(10).pow(
        selectedAsset.decimals
      );
      // @ts-ignore
      setValue(
        amountInputName,
        maxAmount
          .multipliedBy(percentage)
          .multipliedBy(tokenElementaryParts)
          .dividedToIntegerBy(100)
          .dividedBy(tokenElementaryParts)
      );
    },
    [
      setValue,
      amountInputName,
      balance,
      selectedAsset.type,
      selectedAsset.decimals,
    ]
  );

  const handleSelectedAssetChange = useCallback(
    (newValue: AssetIdentifier) => {
      onAssetChange(newValue);
      setSearchString("");
    },
    [onAssetChange]
  );

  return (
    <div className={classNames("w-full", className)}>
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
            label={label}
            selectedAsset={selectedAsset}
            balance={balance!}
            max={max}
            searchString={searchString}
            onSearchChange={handleSearchChange}
            onRefreshClick={onRefreshClick}
            amountInputName={amountInputName}
            assetInputName={assetInputName}
            // @ts-ignore
            formContextValues={formContextValues}
            amountReadOnly={amountReadOnly}
          />
        )}
      </Popper>
      {errors[amountInputName] && (
        <div className="mt-1 text-red-700 text-xs">
          {/* @ts-ignore */}
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
    </div>
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
      type="button"
      className="border border-gray-300 text-gray-500 rounded-md ml-1 p-1"
      onClick={handleClick}
    >
      {percentage === 100 ? <T id="max" /> : `${percentage}%`}
    </button>
  );
};

type SwapInputHeaderProps = PopperRenderProps &
  Pick<
    SwapInputProps<string, string, FormValuesBase<string, string>>,
    | "formContextValues"
    | "amountInputName"
    | "amountReadOnly"
    | "assetInputName"
    | "label"
    | "max"
    | "onRefreshClick"
  > & {
    selectedAsset: TempleAssetWithExchangeData;
    balance: BigNumber;
    searchString: string;
    onSearchChange: (e: ChangeEvent<HTMLInputElement>) => void;
  };

const SwapInputHeader = forwardRef<HTMLDivElement, SwapInputHeaderProps>(
  (
    {
      assetInputName,
      formContextValues: { control, watch },
      opened,
      toggleOpened,
      selectedAsset,
      balance,
      label,
      max,
      searchString,
      onRefreshClick,
      onSearchChange,
      amountInputName,
      amountReadOnly,
    },
    ref
  ) => {
    const amount: number | undefined = watch(amountInputName);
    const amountFieldRef = useRef<HTMLInputElement>(null);

    const handleAmountFieldFocus = useCallback((evt) => {
      evt.preventDefault();
      amountFieldRef.current?.focus({ preventScroll: true });
    }, []);

    const handleAmountFieldControlFocus = useCallback(() => {
      amountFieldRef.current?.focus();
    }, []);

    const maxAmount = useMemo(() => {
      const maxByBalance =
        selectedAsset.type === TempleAssetType.TEZ
          ? BigNumber.max(
              balance.minus(mutezToTz(DEXTER_REQUIRED_XTZ_RESERVE)),
              0
            )
          : balance;
      return amountReadOnly
        ? new BigNumber(max ?? Infinity)
        : BigNumber.min(max ?? Infinity, maxByBalance);
    }, [balance, selectedAsset.type, max, amountReadOnly]);

    const validateAmount = useCallback(
      (v?: number) => {
        if (v === undefined) return t("required");
        if (v === 0) {
          return t("amountMustBePositive");
        }
        const vBN = new BigNumber(v);
        return (
          vBN.isLessThanOrEqualTo(maxAmount) ||
          t("maximalAmount", maxAmount.toFixed())
        );
      },
      [maxAmount]
    );

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
              as={AssetTypeInput}
              name={assetInputName}
            />
          </div>
          <div className="flex-1 px-2 flex items-center justify-between">
            <button type="button" className="mr-2" onClick={onRefreshClick}>
              <SyncIcon className="w-4 h-auto text-gray-700 stroke-current stroke-2" />
            </button>
            <div className="h-full flex-1 flex items-end justify-center flex-col">
              <Controller
                control={control}
                className={classNames(
                  "text-gray-700 text-2xl text-right border-none bg-opacity-0",
                  "pl-0 focus:shadow-none -mb-2"
                )}
                style={{ padding: 0, borderRadius: 0 }}
                name={amountInputName}
                min={0}
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

type AssetTypeInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value"
> & {
  value?: AssetIdentifier;
};

const AssetTypeInput = forwardRef<HTMLInputElement, AssetTypeInputProps>(
  ({ value, ...restProps }, ref) => {
    return (
      <input
        ref={ref}
        value={`${value?.address ?? "tez"}-${value?.tokenId}`}
        {...restProps}
      />
    );
  }
);

type AssetsMenuProps = {
  opened: boolean;
  setOpened: (newValue: boolean) => void;
  onChange: (newValue: AssetIdentifier) => void;
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
    (newValue: AssetIdentifier) => {
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
