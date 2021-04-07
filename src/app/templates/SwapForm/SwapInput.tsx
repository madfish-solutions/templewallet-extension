import React, {
  ChangeEvent,
  forwardRef,
  useCallback,
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
import useSwappableAssets from "app/templates/SwapForm/useSwappableAssets";
import { T } from "lib/i18n/react";
import {
  useAccount,
  useBalance,
  TempleAssetWithExchangeData,
  ExchangerType,
  EXCHANGE_XTZ_RESERVE,
  TEZ_ASSET,
  assetsAreSame,
  useOnBlock,
} from "lib/temple/front";
import { TempleAsset, TempleAssetType } from "lib/temple/types";
import Popper, { PopperRenderProps } from "lib/ui/Popper";

export type SwapInputValue = {
  asset?: TempleAssetWithExchangeData;
  amount?: BigNumber;
};

type SwapInputProps = {
  amountReadOnly?: boolean;
  className?: string;
  disabled?: boolean;
  error?: string;
  label: React.ReactNode;
  name: string;
  onChange?: (newValue: SwapInputValue) => void;
  selectedExchanger: ExchangerType;
  shouldFilterAssetsByExchanger?: boolean;
  value?: SwapInputValue;
  withPercentageButtons?: boolean;
};

const BUTTONS_PERCENTAGES = [25, 50, 75, 100];

const defaultInputValue: SwapInputValue = {};
const SwapInput = forwardRef<HTMLInputElement, SwapInputProps>(
  (
    {
      amountReadOnly,
      className,
      disabled,
      error,
      label,
      name,
      onChange,
      selectedExchanger,
      shouldFilterAssetsByExchanger,
      value = defaultInputValue,
      withPercentageButtons,
    },
    ref
  ) => {
    const { asset, amount } = value;

    const [searchString, setSearchString] = useState("");
    const [tokenId, setTokenId] = useState<number>();
    const { publicKeyHash: accountPkh } = useAccount();
    const {
      assets,
      isLoading: assetsLoading,
      updateTokensExchangeData,
      tokenIdRequired,
    } = useSwappableAssets(searchString, tokenId);

    const filteredAssets = useMemo(() => {
      if (shouldFilterAssetsByExchanger) {
        return assets.filter((asset) => !!asset[selectedExchanger]);
      }
      return assets;
    }, [shouldFilterAssetsByExchanger, assets, selectedExchanger]);

    const { data: balance, revalidate: updateBalance } = useBalance(
      asset ?? TEZ_ASSET,
      accountPkh,
      { suspense: false }
    );
    useOnBlock(updateBalance);

    const max = useMemo(() => {
      if (!asset) {
        return new BigNumber(0);
      }
      if (amountReadOnly) {
        return new BigNumber(Infinity);
      }
      const exchangableAmount =
        asset.type === TempleAssetType.TEZ
          ? balance?.minus(EXCHANGE_XTZ_RESERVE)
          : balance;
      return BigNumber.min(
        asset[selectedExchanger]?.maxExchangable ?? new BigNumber(Infinity),
        exchangableAmount ?? new BigNumber(Infinity)
      );
    }, [asset, balance, amountReadOnly, selectedExchanger]);

    const handleSearchChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        setSearchString(e.target.value);
      },
      []
    );

    const handleAmountChange = useCallback(
      (value?: number) => {
        onChange?.({
          asset,
          amount: value === undefined ? undefined : new BigNumber(value),
        });
      },
      [onChange, asset]
    );

    const handlePercentageClick = useCallback(
      (percentage: number) => {
        if (!asset) {
          return;
        }
        const tokenElementaryParts = new BigNumber(10).pow(asset.decimals);
        onChange?.({
          asset,
          amount: (max ?? new BigNumber(0))
            .multipliedBy(percentage)
            .multipliedBy(tokenElementaryParts)
            .dividedToIntegerBy(100)
            .dividedBy(tokenElementaryParts),
        });
      },
      [onChange, asset, max]
    );

    const handleSelectedAssetChange = useCallback(
      (newValue: TempleAssetWithExchangeData) => {
        onChange?.({
          asset: newValue,
          amount,
        });
        setSearchString("");
        setTokenId(undefined);
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
          preventOverflow={false}
          popup={({ opened, setOpened }) => (
            <AssetsMenu
              isLoading={assetsLoading}
              opened={opened}
              setOpened={setOpened}
              onChange={handleSelectedAssetChange}
              options={filteredAssets}
              searchString={searchString}
              tokenIdMissing={tokenId === undefined && tokenIdRequired}
              value={asset}
            />
          )}
        >
          {({ ref, opened, toggleOpened, setOpened }) => (
            <SwapInputHeader
              amount={amount}
              disabled={disabled}
              ref={(ref as unknown) as React.RefObject<HTMLDivElement>}
              toggleOpened={toggleOpened}
              opened={opened}
              setOpened={setOpened}
              label={label}
              onAmountChange={handleAmountChange}
              selectedAsset={asset}
              selectedExchanger={selectedExchanger}
              balance={asset ? balance : undefined}
              searchString={searchString}
              onSearchChange={handleSearchChange}
              onRefreshClick={updateTokensExchangeData}
              tokenIdRequired={tokenIdRequired}
              amountReadOnly={amountReadOnly}
              tokenId={tokenId}
              onTokenIdChange={setTokenId}
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
  Pick<
    SwapInputProps,
    "selectedExchanger" | "label" | "amountReadOnly" | "disabled"
  > & {
    amount?: BigNumber;
    selectedAsset?: TempleAssetWithExchangeData;
    balance?: BigNumber;
    onAmountChange: (value?: number) => void;
    searchString: string;
    onSearchChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onRefreshClick: () => void;
    tokenIdRequired: boolean;
    tokenId?: number;
    onTokenIdChange: (value?: number) => void;
  };

const SwapInputHeader = forwardRef<HTMLDivElement, SwapInputHeaderProps>(
  (
    {
      amount,
      opened,
      toggleOpened,
      selectedAsset,
      balance,
      disabled,
      label,
      onAmountChange,
      searchString,
      onRefreshClick,
      onSearchChange,
      amountReadOnly,
      selectedExchanger,
      tokenIdRequired,
      tokenId,
      onTokenIdChange,
    },
    ref
  ) => {
    const amountFieldRef = useRef<HTMLInputElement>(null);

    const handleAmountFieldFocus = useCallback((evt) => {
      evt.preventDefault();
      amountFieldRef.current?.focus({ preventScroll: true });
    }, []);

    const assetUsdPrice = selectedAsset?.[selectedExchanger]?.usdPrice;

    return (
      <div className="w-full text-gray-700" ref={ref}>
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
              {balance && (
                <span
                  className={classNames(
                    "text-sm mr-1 text-gray-700",
                    balance.eq(0) && "text-red-700"
                  )}
                >
                  <Money smallFractionFont={false}>{balance}</Money>
                </span>
              )}
              <span>{selectedAsset.symbol}</span>
            </span>
          )}
        </div>
        <div
          className={classNames(
            "w-full border rounded-md border-gray-300 flex items-stretch",
            !opened && "hidden"
          )}
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
                className="w-full px-2"
                value={searchString}
                onChange={onSearchChange}
              />
            </div>
            {tokenIdRequired && (
              <div className="w-24 flex items-stretch border-l border-gray-300">
                <AssetField
                  containerClassName="items-stretch"
                  containerStyle={{ flexDirection: "row" }}
                  disabled={disabled}
                  fieldWrapperBottomMargin={false}
                  value={tokenId}
                  className={classNames(
                    "text-lg border-none bg-opacity-0",
                    "focus:shadow-none"
                  )}
                  onChange={onTokenIdChange}
                  placeholder="Token ID"
                  style={{ padding: "0 0.5rem", borderRadius: 0 }}
                  assetDecimals={0}
                />
              </div>
            )}
          </div>
        </div>
        <div
          className={classNames(
            "w-full border rounded-md border-gray-300 flex items-stretch",
            opened && "hidden"
          )}
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
              <div className="w-24 mr-4 h-8" />
            )}

            <ChevronDownIcon className="w-4 h-auto text-gray-700 stroke-current stroke-2" />
          </div>
          <div className="flex-1 px-2 flex items-center justify-between">
            <button type="button" className="mr-2" onClick={onRefreshClick}>
              <SyncIcon className="w-4 h-auto text-gray-700 stroke-current stroke-2" />
            </button>
            <div className="h-full flex-1 flex items-end justify-center flex-col">
              <AssetField
                disabled={disabled}
                fieldWrapperBottomMargin={false}
                value={amount?.toNumber()}
                ref={amountFieldRef}
                onFocus={handleAmountFieldFocus}
                className={classNames(
                  "text-gray-700 text-2xl text-right border-none bg-opacity-0",
                  "pl-0 focus:shadow-none"
                )}
                onChange={onAmountChange}
                style={{ padding: 0, borderRadius: 0 }}
                min={0}
                readOnly={amountReadOnly}
                assetDecimals={selectedAsset?.decimals ?? 0}
              />
              {amount !== undefined && assetUsdPrice !== undefined && (
                <span className="mt-2 text-xs text-gray-700">
                  ≈{" "}
                  {new BigNumber(amount)
                    .multipliedBy(assetUsdPrice)
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
  isLoading: boolean;
  opened: boolean;
  tokenIdMissing: boolean;
  setOpened: (newValue: boolean) => void;
  onChange: (newValue: TempleAssetWithExchangeData) => void;
  options: TempleAssetWithExchangeData[];
  searchString?: string;
  value?: TempleAssetWithExchangeData;
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
    (newValue: TempleAssetWithExchangeData) => {
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
        maxHeight: "20rem",
        backgroundColor: "white",
        borderColor: "#e2e8f0",
        padding: 0,
      }}
    >
      {options.length === 0 || isLoading ? (
        <div
          className={classNames(
            "my-8",
            "flex flex-col items-center justify-center",
            "text-gray-500"
          )}
        >
          {isLoading ? (
            <Spinner theme="primary" style={{ width: "3rem" }} />
          ) : (
            <p
              className={classNames(
                "flex items-center justify-center",
                "text-gray-600 text-base font-light"
              )}
            >
              {searchString ? (
                <SearchIcon className="w-5 h-auto mr-1 stroke-current" />
              ) : null}

              <span>
                {tokenIdMissing ? "Specify token ID" : <T id="noAssetsFound" />}
              </span>
            </p>
          )}
        </div>
      ) : (
        options.map((option, index) => (
          <AssetOption
            key={getAssetKey(option) ?? "tez"}
            option={option}
            selected={value === getAssetKey(option)}
            onClick={handleOptionClick}
            isLast={index === options.length - 1}
          />
        ))
      )}
    </DropdownWrapper>
  );
};

type AssetOptionProps = {
  option: TempleAssetWithExchangeData;
  selected: boolean;
  onClick: (newValue: TempleAssetWithExchangeData) => void;
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
        {balance && <Money smallFractionFont={false}>{balance}</Money>}
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
