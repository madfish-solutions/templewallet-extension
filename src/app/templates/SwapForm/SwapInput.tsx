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
import Money from "app/atoms/Money";
import Spinner from "app/atoms/Spinner";
import { ReactComponent as ChevronDownIcon } from "app/icons/chevron-down.svg";
import { ReactComponent as SearchIcon } from "app/icons/search.svg";
import { ReactComponent as SyncIcon } from "app/icons/sync.svg";
import AssetIcon from "app/templates/AssetIcon";
import useSwappableAssets, {
  getAssetExchangeData,
  TokensExchangeData,
} from "app/templates/SwapForm/useSwappableAssets";
import { useFormAnalytics } from "lib/analytics";
import { toLocalFormat } from "lib/i18n/numbers";
import { t, T } from "lib/i18n/react";
import {
  useAccount,
  useBalance,
  ExchangerType,
  EXCHANGE_XTZ_RESERVE,
  TEZ_ASSET,
  assetsAreSame,
  useOnBlock,
  assetAmountToUSD,
  usdToAssetAmount,
  useNetwork,
  getAssetKey,
} from "lib/temple/front";
import { TempleAsset, TempleAssetType } from "lib/temple/types";
import Popper, { PopperRenderProps } from "lib/ui/Popper";

export type SwapInputValue = {
  asset?: TempleAsset;
  amount?: BigNumber;
  usdAmount?: BigNumber;
};

type SwapInputProps = {
  className?: string;
  disabled?: boolean;
  error?: string;
  label: React.ReactNode;
  loading?: boolean;
  name: string;
  onBlur?: () => void;
  onChange?: (newValue: SwapInputValue) => void;
  selectedExchanger: ExchangerType;
  triggerValidation?: (
    payload?: string | string[] | undefined,
    shouldRender?: boolean | undefined
  ) => void;
  value?: SwapInputValue;
  withPercentageButtons?: boolean;
  isOutput?: boolean;
};

const BUTTONS_PERCENTAGES = [25, 50, 75, 100];

const defaultInputValue: SwapInputValue = {};
const SwapInput = forwardRef<HTMLInputElement, SwapInputProps>(
  (
    {
      className,
      disabled,
      error,
      label,
      loading,
      isOutput,
      name,
      onBlur,
      onChange,
      selectedExchanger,
      triggerValidation,
      value = defaultInputValue,
      withPercentageButtons,
    },
    ref
  ) => {
    const { asset, amount, usdAmount } = value;

    const [shouldShowUsd, setShouldShowUsd] = useState(false);
    const [searchString, setSearchString] = useState("");
    const [tokenId, setTokenId] = useState<number>();
    const { publicKeyHash: accountPkh } = useAccount();
    const {
      assets,
      isLoading: assetsLoading,
      tokenIdRequired,
      tokensExchangeData,
      tezUsdPrice,
    } = useSwappableAssets(searchString, tokenId);
    const { trackChange } = useFormAnalytics("SwapForm");

    const { data: balance, revalidate: updateBalance } = useBalance(
      asset ?? TEZ_ASSET,
      accountPkh,
      { suspense: false }
    );
    useOnBlock(updateBalance);

    const assetExchangeData = useMemo(
      () =>
        asset &&
        getAssetExchangeData(
          tokensExchangeData,
          tezUsdPrice,
          asset,
          selectedExchanger
        ),
      [tokensExchangeData, tezUsdPrice, asset, selectedExchanger]
    );

    const maxAmount = useMemo(() => {
      if (!asset) {
        return new BigNumber(0);
      }
      if (isOutput) {
        return new BigNumber(Infinity);
      }
      const exchangableAmount =
        asset.type === TempleAssetType.TEZ
          ? balance?.minus(EXCHANGE_XTZ_RESERVE)
          : balance;
      return BigNumber.max(
        BigNumber.min(
          assetExchangeData?.maxExchangable ?? new BigNumber(Infinity),
          exchangableAmount ?? new BigNumber(Infinity)
        ),
        0
      );
    }, [asset, balance, isOutput, assetExchangeData]);
    const assetUsdPrice = assetExchangeData?.usdPrice;
    const actualShouldShowUsd = shouldShowUsd && !!assetUsdPrice;

    useEffect(() => {
      if (shouldShowUsd && !actualShouldShowUsd) {
        setShouldShowUsd(false);
      }
    }, [shouldShowUsd, actualShouldShowUsd]);

    const handleSearchChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        setTokenId(undefined);
        setSearchString(e.target.value);
      },
      []
    );

    const handleAmountChange = useCallback(
      (amount?: BigNumber, usdAmount?: BigNumber) => {
        onChange?.({
          asset,
          amount,
          usdAmount,
        });
      },
      [onChange, asset]
    );

    const handlePercentageClick = useCallback(
      (percentage: number) => {
        if (!asset) {
          return;
        }
        const newAmount = (maxAmount ?? new BigNumber(0))
          .multipliedBy(percentage)
          .div(100)
          .decimalPlaces(asset.decimals, BigNumber.ROUND_DOWN);
        const newUsdAmount = assetAmountToUSD(newAmount, assetUsdPrice);
        onChange?.({
          asset,
          amount: newAmount,
          usdAmount: newUsdAmount,
        });
        triggerValidation?.(name);
      },
      [onChange, asset, assetUsdPrice, maxAmount, triggerValidation, name]
    );

    const handleSelectedAssetChange = useCallback(
      (newValue: TempleAsset) => {
        const newAmount = amount?.decimalPlaces(
          newValue.decimals,
          BigNumber.ROUND_DOWN
        );
        const newUsdAmount = assetAmountToUSD(newAmount, assetUsdPrice);
        onChange?.({
          asset: newValue,
          amount: newAmount,
          usdAmount: newUsdAmount,
        });
        if (asset) {
          trackChange({ [name]: asset.symbol }, { [name]: newValue.symbol });
        }
        setSearchString("");
        setTokenId(undefined);
        onBlur?.();
      },
      [onChange, amount, onBlur, trackChange, asset, name, assetUsdPrice]
    );

    const handleInUSDToggle = useCallback(() => {
      setShouldShowUsd((prevShouldShowUsd) => !prevShouldShowUsd);
    }, []);

    const reservationTip = useMemo(
      () =>
        t(
          "amountMustBeReservedForNetworkFees",
          `${EXCHANGE_XTZ_RESERVE.toString()} TEZ${
            actualShouldShowUsd
              ? ` (≈$${assetAmountToUSD(
                  EXCHANGE_XTZ_RESERVE,
                  assetUsdPrice,
                  BigNumber.ROUND_UP
                )})`
              : ""
          }`
        ),
      [actualShouldShowUsd, assetUsdPrice]
    );

    const prettyError = useMemo(() => {
      if (!error) {
        return error;
      }
      if (error.startsWith("amountReserved")) {
        return reservationTip;
      }
      if (error.startsWith("maximalAmount")) {
        const amountAsset = new BigNumber(error.split(":")[1]);
        return t(
          "maximalAmount",
          (actualShouldShowUsd
            ? assetAmountToUSD(amountAsset, assetUsdPrice)
            : amountAsset
          )?.toFixed()
        );
      }
      return error;
    }, [error, actualShouldShowUsd, assetUsdPrice, reservationTip]);

    const shouldShowReservationTip =
      asset?.type === TempleAssetType.TEZ &&
      maxAmount.lte(amount ?? 0) &&
      !prettyError;

    return (
      <div className={classNames("w-full", className)} onBlur={onBlur}>
        <input className="hidden" name={name} ref={ref} />
        <Popper
          placement="bottom"
          strategy="fixed"
          modifiers={[sameWidth]}
          fallbackPlacementsEnabled={false}
          popup={({ opened, setOpened }) => (
            <AssetsMenu
              isLoading={assetsLoading}
              opened={opened}
              setOpened={setOpened}
              onChange={handleSelectedAssetChange}
              options={assets}
              searchString={searchString}
              tokenIdMissing={tokenId === undefined && tokenIdRequired}
              value={asset}
            />
          )}
        >
          {({ ref, opened, toggleOpened, setOpened }) => (
            <SwapInputHeader
              amount={amount}
              amountLoading={loading}
              balance={asset ? balance : undefined}
              disabled={disabled}
              label={label}
              onAmountChange={handleAmountChange}
              onInUSDToggle={handleInUSDToggle}
              onSearchChange={handleSearchChange}
              onTokenIdChange={setTokenId}
              opened={opened}
              ref={ref as unknown as React.RefObject<HTMLDivElement>}
              searchString={searchString}
              selectedAsset={asset}
              selectedExchanger={selectedExchanger}
              setOpened={setOpened}
              shouldShowUsd={actualShouldShowUsd}
              tezUsdPrice={tezUsdPrice}
              tokenIdRequired={tokenIdRequired}
              tokenId={tokenId}
              tokensExchangeData={tokensExchangeData}
              toggleOpened={toggleOpened}
              usdAmount={usdAmount}
            />
          )}
        </Popper>
        <div
          className={classNames(
            withPercentageButtons && "mt-1",
            "w-full flex items-center",
            prettyError || shouldShowReservationTip
              ? "justify-between"
              : "justify-end"
          )}
        >
          {prettyError && (
            <div className="text-red-700 text-xs">{prettyError}</div>
          )}
          {shouldShowReservationTip && (
            <div className="text-gray-500 text-xs">{reservationTip}</div>
          )}
          {withPercentageButtons && (
            <div className="flex">
              {BUTTONS_PERCENTAGES.map((percentage) => (
                <PercentageButton
                  disabled={!balance}
                  key={percentage}
                  percentage={percentage}
                  onClick={handlePercentageClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
);

export default SwapInput;

type PercentageButtonProps = {
  disabled: boolean;
  percentage: number;
  onClick: (percentage: number) => void;
};

const PercentageButton: React.FC<PercentageButtonProps> = ({
  percentage,
  onClick,
  disabled,
}) => {
  const handleClick = useCallback(
    () => onClick(percentage),
    [onClick, percentage]
  );

  return (
    <button
      disabled={disabled}
      type="button"
      className={classNames(
        "border border-gray-300 text-gray-500 rounded-md ml-1",
        "h-5 w-8 flex justify-center items-center leading-tight"
      )}
      onClick={handleClick}
    >
      {percentage === 100 ? <T id="max" /> : `${percentage}%`}
    </button>
  );
};

type SwapInputHeaderProps = PopperRenderProps &
  Pick<SwapInputProps, "selectedExchanger" | "label" | "disabled"> & {
    amount?: BigNumber;
    amountLoading?: boolean;
    balance?: BigNumber;
    onAmountChange: (amount?: BigNumber, usdAmount?: BigNumber) => void;
    onInUSDToggle: () => void;
    onSearchChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onTokenIdChange: (value?: number) => void;
    searchString: string;
    selectedAsset?: TempleAsset;
    shouldShowUsd: boolean;
    tezUsdPrice: number | null;
    tokenIdRequired: boolean;
    tokenId?: number;
    tokensExchangeData: TokensExchangeData;
    usdAmount?: BigNumber;
  };

const SwapInputHeader = forwardRef<HTMLDivElement, SwapInputHeaderProps>(
  (
    {
      amount,
      amountLoading,
      balance,
      disabled,
      label,
      onAmountChange,
      onInUSDToggle,
      onSearchChange,
      onTokenIdChange,
      opened,
      searchString,
      selectedAsset,
      selectedExchanger,
      shouldShowUsd,
      tezUsdPrice,
      tokenIdRequired,
      tokenId,
      toggleOpened,
      tokensExchangeData,
      usdAmount,
    },
    ref
  ) => {
    const displayedAmount = shouldShowUsd ? usdAmount : amount;
    const amountFieldRef = useRef<HTMLInputElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [isActive, setIsActive] = useState(false);
    const network = useNetwork();

    const prevOpenedRef = useRef(opened);
    useEffect(() => {
      if (!prevOpenedRef.current && opened) {
        searchInputRef.current?.focus();
      }
      prevOpenedRef.current = opened;
    }, [opened]);

    const handleAmountFieldFocus = useCallback((evt) => {
      evt.preventDefault();
      setIsActive(true);
      amountFieldRef.current?.focus({ preventScroll: true });
    }, []);
    const setFieldActive = useCallback(() => {
      setIsActive(true);
    }, []);
    const setFieldInactive = useCallback(() => {
      setIsActive(false);
    }, []);
    const assetUsdPrice =
      selectedAsset &&
      getAssetExchangeData(
        tokensExchangeData,
        tezUsdPrice,
        selectedAsset,
        selectedExchanger
      )?.usdPrice;
    const canSwitchToUSD = !!assetUsdPrice;

    const displayedBalance = useMemo(() => {
      if (balance && shouldShowUsd) {
        return assetAmountToUSD(balance, assetUsdPrice);
      }
      return balance;
    }, [balance, shouldShowUsd, assetUsdPrice]);
    const displayedConversionNumber = shouldShowUsd ? amount : usdAmount;

    const handleAmountChange = useCallback(
      (newValue?: string) => {
        if (!newValue) {
          onAmountChange();
        } else if (shouldShowUsd) {
          const newValueUsd = new BigNumber(newValue);
          const newValueAsset = usdToAssetAmount(
            newValueUsd,
            assetUsdPrice,
            selectedAsset!.decimals
          );
          onAmountChange(newValueAsset, newValueUsd);
        } else {
          const newValueAsset = new BigNumber(newValue);
          const newValueUsd = assetAmountToUSD(newValueAsset, assetUsdPrice);
          onAmountChange(newValueAsset, newValueUsd);
        }
      },
      [onAmountChange, assetUsdPrice, shouldShowUsd, selectedAsset]
    );

    const handleTokenIdChange = useCallback(
      (newValue?: string) => {
        const newValueNum = newValue ? Number(newValue) : undefined;
        onTokenIdChange(newValueNum);
      },
      [onTokenIdChange]
    );

    return (
      <div className="w-full text-gray-700">
        <div className="w-full flex mb-1 items-center justify-between">
          <span className="text-xl text-gray-900">{label}</span>
          {selectedAsset && (
            <span
              className={classNames(
                opened && "hidden",
                "text-xs text-gray-500"
              )}
            >
              <span className="mr-1">
                <T id="balance" />
              </span>
              {displayedBalance && (
                <span
                  className={classNames(
                    "text-sm mr-1 text-gray-700",
                    displayedBalance.eq(0) && "text-red-700"
                  )}
                >
                  {shouldShowUsd ? "≈" : ""}
                  <Money smallFractionFont={false} fiat={shouldShowUsd}>
                    {displayedBalance}
                  </Money>
                </span>
              )}
              <span>{shouldShowUsd ? "$" : selectedAsset.symbol}</span>
            </span>
          )}
        </div>
        <div
          className={classNames(
            isActive && "border-orange-500 bg-gray-100",
            "transition ease-in-out duration-200",
            "w-full border rounded-md border-gray-300"
          )}
          ref={ref}
        >
          <div
            className={classNames(
              "w-full flex items-stretch",
              !opened && "hidden"
            )}
            style={{ height: "4.5rem" }}
          >
            <div className="items-center ml-5 mr-3 my-6">
              <SearchIcon className="w-6 h-auto text-gray-500 stroke-current stroke-2" />
            </div>
            <div
              className={classNames(
                "text-lg flex flex-1 items-stretch",
                disabled && "pointer-events-none"
              )}
            >
              <div className="flex-1 flex items-stretch mr-2">
                <input
                  className="w-full px-2 bg-transparent"
                  onBlur={setFieldInactive}
                  onFocus={setFieldActive}
                  value={searchString}
                  onChange={onSearchChange}
                  ref={searchInputRef}
                />
              </div>
              {tokenIdRequired && (
                <div className="w-24 flex items-stretch border-l border-gray-300">
                  <AssetField
                    containerClassName="items-stretch"
                    containerStyle={{ flexDirection: "row" }}
                    disabled={disabled}
                    fieldWrapperBottomMargin={false}
                    onBlur={setFieldInactive}
                    onFocus={setFieldActive}
                    value={tokenId}
                    className="text-lg border-none bg-opacity-0 focus:shadow-none"
                    onChange={handleTokenIdChange}
                    placeholder={t("tokenId")}
                    style={{ padding: "0 0.5rem", borderRadius: 0 }}
                    assetDecimals={0}
                  />
                </div>
              )}
            </div>
          </div>
          <div
            className={classNames(
              "w-full flex items-stretch",
              opened && "hidden"
            )}
            style={{ height: "4.5rem" }}
          >
            <div
              className={classNames(
                "border-r border-gray-300 pl-4 pr-3 flex py-5 items-center",
                disabled ? "pointer-events-none" : "cursor-pointer"
              )}
              onClick={disabled ? undefined : toggleOpened}
            >
              {selectedAsset ? (
                <>
                  <AssetIcon asset={selectedAsset} size={32} className="mr-2" />
                  <span
                    className="text-gray-700 text-lg mr-2 items-center overflow-hidden block w-16"
                    style={{ textOverflow: "ellipsis" }}
                  >
                    {selectedAsset.type === TempleAssetType.TEZ
                      ? selectedAsset.symbol.toUpperCase()
                      : selectedAsset.symbol}
                  </span>
                </>
              ) : (
                <div className="w-24 mr-4 text-gray-500 text-sm font-medium leading-tight">
                  <div className="w-12">
                    <T id="selectToken" />
                  </div>
                </div>
              )}

              <ChevronDownIcon className="w-4 h-auto text-gray-700 stroke-current stroke-2" />
            </div>
            <div className="flex-1 px-2 flex items-center justify-between">
              {canSwitchToUSD && (
                <button
                  type="button"
                  className={classNames("mr-2", !assetUsdPrice && "hidden")}
                  onClick={onInUSDToggle}
                  onFocus={setFieldActive}
                  onBlur={setFieldInactive}
                >
                  <SyncIcon className="w-4 h-auto text-gray-700 stroke-current stroke-1" />
                </button>
              )}
              <div
                className={classNames(
                  "h-full flex-1 flex items-end justify-center flex-col",
                  amountLoading && "hidden"
                )}
              >
                <AssetField
                  disabled={disabled}
                  fieldWrapperBottomMargin={false}
                  value={displayedAmount?.toString()}
                  ref={amountFieldRef}
                  onBlur={setFieldInactive}
                  onFocus={handleAmountFieldFocus}
                  className={classNames(
                    "text-gray-700 text-2xl text-right border-none bg-opacity-0",
                    "pl-0 focus:shadow-none"
                  )}
                  onChange={handleAmountChange}
                  placeholder={toLocalFormat(0, { decimalPlaces: 2 })}
                  style={{ padding: 0, borderRadius: 0 }}
                  min={0}
                  assetDecimals={
                    shouldShowUsd ? 2 : selectedAsset?.decimals ?? 0
                  }
                />
                {network.type === "main" && (
                  <span
                    className={classNames(
                      "mt-2 text-xs",
                      displayedConversionNumber === undefined
                        ? "text-gray-500"
                        : "text-gray-700"
                    )}
                  >
                    ≈{" "}
                    <Money smallFractionFont={false} fiat={!shouldShowUsd}>
                      {displayedConversionNumber ?? 0}
                    </Money>
                    <span className="text-gray-500">{` ${
                      shouldShowUsd ? selectedAsset!.symbol : "$"
                    }`}</span>
                  </span>
                )}
              </div>
              <div
                className={classNames(
                  "h-full flex-1 flex items-end justify-center flex-col",
                  !amountLoading && "hidden"
                )}
              >
                <Spinner theme="primary" style={{ width: "3rem" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

type AssetsMenuProps = {
  isLoading: boolean;
  opened: boolean;
  tokenIdMissing: boolean;
  setOpened: (newValue: boolean) => void;
  onChange: (newValue: TempleAsset) => void;
  options: TempleAsset[];
  searchString?: string;
  value?: TempleAsset;
};

const AssetsMenu: React.FC<AssetsMenuProps> = ({
  isLoading,
  opened,
  setOpened,
  onChange,
  options,
  searchString,
  tokenIdMissing,
  value,
}) => {
  const handleOptionClick = useCallback(
    (newValue: TempleAsset) => {
      if (!value || !assetsAreSame(newValue, value)) {
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
        maxHeight: "15.75rem",
        backgroundColor: "white",
        borderColor: "#e2e8f0",
        padding: 0,
      }}
    >
      {(options.length === 0 || isLoading) && (
        <div className="my-8 flex flex-col items-center justify-center text-gray-500">
          {isLoading ? (
            <Spinner theme="primary" style={{ width: "3rem" }} />
          ) : (
            <p className="flex items-center justify-center text-gray-600 text-base font-light">
              {searchString ? (
                <SearchIcon className="w-5 h-auto mr-1 stroke-current" />
              ) : null}

              <span>
                {tokenIdMissing ? (
                  <T id="specifyTokenId" />
                ) : (
                  <T id="noAssetsFound" />
                )}
              </span>
            </p>
          )}
        </div>
      )}
      {options.map((option, index) => (
        <AssetOption
          key={getAssetKey(option) ?? "tez"}
          option={option}
          selected={!!value && getAssetKey(value) === getAssetKey(option)}
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
  onClick: (newValue: TempleAsset) => void;
  isLast: boolean;
};

const AssetOption: React.FC<AssetOptionProps> = ({
  option,
  onClick,
  isLast,
}) => {
  const handleClick = useCallback(() => {
    onClick(option);
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
      <span className="text-gray-700 text-lg mr-2">
        {option.type === TempleAssetType.TEZ
          ? option.symbol.toUpperCase()
          : option.symbol}
      </span>
      <div className="flex-1 text-right text-lg text-gray-600">
        {balance && (
          <Money smallFractionFont={false} tooltip={false}>
            {balance}
          </Money>
        )}
      </div>
    </button>
  );
};

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
