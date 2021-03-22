import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import BigNumber from "bignumber.js";
import classNames from "clsx";
import { Controller, useForm } from "react-hook-form";
import { browser } from "webextension-polyfill-ts";

import AssetField from "app/atoms/AssetField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import { ReactComponent as SwapVerticalIcon } from "app/icons/swap-vertical.svg";
import SwapInput from "app/templates/SwapForm/SwapInput";
import { t } from "lib/i18n/react";
import { useRetryableSWR } from "lib/swr";
import {
  TempleAssetType,
  TEZ_ASSET,
  useSwappableAssets,
  getAssetId,
  AssetIdentifier,
  idsAreEqual,
  matchesAsset,
  useNetwork,
  getTokenOutput,
  useTezos,
  tzToMutez,
  DEXTER_EXCHANGE_CONTRACTS,
  getMutezOutput,
  TempleAsset,
  mutezToTz,
  useChainId,
  ALL_EXCHANGERS_TYPES,
} from "lib/temple/front";

import "./SwapForm.css";

type ExchangerId = "quipuswap" | "dexter";

type SwapFormValues = {
  inputAsset: AssetIdentifier;
  inputAssetAmount: number;
  outputAsset: AssetIdentifier;
  exchanger: ExchangerId;
  tolerancePercentage: number;
  outputAssetAmount: number;
};

const exchangeFeePercentage = new BigNumber("0.3");
const maxTolerancePercentage = 30;

const SwapFormWrapper: React.FC = () => {
  const { assets } = useSwappableAssets();

  if (Object.values(assets).every((value) => value.length < 2)) {
    return <p>Sorry, no exchangers are available for the current network.</p>;
  }

  return <SwapForm />;
};

export default SwapFormWrapper;

const SwapForm: React.FC = () => {
  const { assets, quipuswapTokensExchangeContracts } = useSwappableAssets();
  const tezos = useTezos();
  const chainId = useChainId(true)!;
  const network = useNetwork();
  const defaultExchanger = assets.quipuswap.length > 1 ? "quipuswap" : "dexter";
  const defaultOutputAsset = assets[defaultExchanger][1];
  const defaultOutputAssetId = useMemo(() => {
    return getAssetId(defaultOutputAsset);
  }, [defaultOutputAsset]);
  const formContextValues = useForm<SwapFormValues>({
    defaultValues: {
      exchanger: defaultExchanger,
      inputAsset: {},
      outputAsset: defaultOutputAssetId,
      tolerancePercentage: 1,
    },
  });
  const {
    handleSubmit,
    errors,
    watch,
    setValue,
    control,
    register,
  } = formContextValues;
  const inputAsset = watch("inputAsset");
  const inputAssetAmount = watch("inputAssetAmount");
  const outputAsset = watch("outputAsset");
  const selectedExchanger = watch("exchanger");
  const tolerancePercentage = watch("tolerancePercentage");

  const inputAssets = assets[selectedExchanger];

  const outputAssets = useMemo(() => {
    if (selectedExchanger === "dexter") {
      return inputAsset.address
        ? [TEZ_ASSET]
        : assets.dexter.filter(({ type }) => type !== TempleAssetType.TEZ);
    }
    return assets.quipuswap;
  }, [inputAsset, selectedExchanger, assets]);

  const selectedInputAsset = useMemo(
    () =>
      inputAssets.find((asset) => matchesAsset(inputAsset, asset)) || TEZ_ASSET,
    [inputAsset, inputAssets]
  );
  const selectedOutputAsset = useMemo(
    () =>
      outputAssets.find((asset) => matchesAsset(outputAsset, asset)) ||
      assets[selectedExchanger][1],
    [outputAsset, outputAssets, assets, selectedExchanger]
  );

  const submitDisabled = Object.keys(errors).length !== 0;

  const getContractAddress = useCallback(
    (asset: TempleAsset, exchanger: ExchangerId) => {
      if (asset.type === TempleAssetType.TEZ) {
        return undefined;
      }
      const tokenId = asset.type === TempleAssetType.FA2 ? asset.id : 0;
      const contracts =
        exchanger === "dexter"
          ? DEXTER_EXCHANGE_CONTRACTS.get(chainId)!
          : quipuswapTokensExchangeContracts;
      return contracts[asset.address]?.[tokenId];
    },
    [chainId, quipuswapTokensExchangeContracts]
  );

  const getOutputTezAmounts = useCallback(
    async (inputAsset: TempleAsset, amount: number) => {
      const rawAssetAmount = new BigNumber(amount).multipliedBy(
        new BigNumber(10).pow(inputAsset.decimals)
      );
      const amounts = await Promise.all(
        ALL_EXCHANGERS_TYPES.map(async (exchangerType) => {
          const contractAddress = getContractAddress(inputAsset, exchangerType);
          if (!contractAddress) {
            return inputAsset.type === TempleAssetType.TEZ
              ? new BigNumber(amount)
              : undefined;
          }

          return mutezToTz(
            await getMutezOutput(tezos, rawAssetAmount, {
              address: contractAddress,
              type: "dexter",
            })
          );
        })
      );
      return ALL_EXCHANGERS_TYPES.reduce<
        Partial<Record<ExchangerId, BigNumber>>
      >(
        (resultPart, exchangerType, index) => ({
          ...resultPart,
          [exchangerType]: amounts[index],
        }),
        {}
      );
    },
    [getContractAddress, tezos]
  );

  const getOutputAmount = useCallback(
    async (tez: BigNumber, outputAsset: TempleAsset, type: ExchangerId) => {
      const contractAddress = getContractAddress(outputAsset, type);
      if (!contractAddress) {
        return outputAsset.type === TempleAssetType.TEZ ? tez : undefined;
      }
      const outputAssetElementaryParts = new BigNumber(10).pow(
        outputAsset.decimals
      );
      return (
        await getTokenOutput(tezos, tzToMutez(tez), {
          address: contractAddress,
          type,
        })
      ).div(outputAssetElementaryParts);
    },
    [getContractAddress, tezos]
  );

  const getOutputAssetAmounts = useCallback(async () => {
    if (inputAssetAmount === undefined) {
      return undefined;
    }
    const {
      dexter: dexterTezAmount,
      quipuswap: quipuswapTezAmount,
    } = await getOutputTezAmounts(selectedInputAsset, inputAssetAmount);
    return {
      dexter:
        dexterTezAmount &&
        (await getOutputAmount(dexterTezAmount, selectedOutputAsset, "dexter")),
      quipuswap:
        quipuswapTezAmount &&
        (await getOutputAmount(
          quipuswapTezAmount,
          selectedOutputAsset,
          "quipuswap"
        )),
    };
  }, [
    getOutputAmount,
    getOutputTezAmounts,
    inputAssetAmount,
    selectedInputAsset,
    selectedOutputAsset,
  ]);

  const { data: outputAssetAmounts } = useRetryableSWR(
    [
      "swap-output",
      outputAsset.address,
      outputAsset.tokenId,
      inputAsset.address,
      inputAsset.tokenId,
      inputAssetAmount,
      network.id,
    ],
    getOutputAssetAmounts,
    { suspense: false }
  );

  const outputAssetAmount = outputAssetAmounts?.[selectedExchanger];

  const minimumReceived = useMemo(() => {
    if ([outputAssetAmount, tolerancePercentage].includes(undefined)) {
      return undefined;
    }
    const tokensParts = new BigNumber(10).pow(selectedOutputAsset.decimals);
    return new BigNumber(outputAssetAmount!)
      .multipliedBy(tokensParts)
      .multipliedBy(100 - tolerancePercentage)
      .dividedBy(100)
      .integerValue()
      .dividedBy(tokensParts);
  }, [outputAssetAmount, selectedOutputAsset.decimals, tolerancePercentage]);

  useEffect(() => {
    setValue("outputAssetAmount", outputAssetAmount?.toNumber());
  }, [outputAssetAmount, setValue]);

  const swapAssets = useCallback(() => {
    setValue([
      { inputAsset: outputAsset },
      { inputAssetAmount: outputAssetAmount },
      { outputAsset: inputAsset },
    ]);
  }, [inputAsset, outputAsset, outputAssetAmount, setValue]);

  const validateTolerancePercentage = useCallback((v?: number) => {
    if (v === undefined) return t("required");
    if (v === 0) {
      return t("amountMustBePositive");
    }
    const vBN = new BigNumber(v);
    return (
      vBN.isLessThanOrEqualTo(maxTolerancePercentage) ||
      t("maximalAmount", [maxTolerancePercentage])
    );
  }, []);

  const handleInputAssetChange = useCallback(
    (newValue: AssetIdentifier) => {
      if (idsAreEqual(newValue, outputAsset)) {
        swapAssets();
      } else {
        setValue("inputAsset", newValue);
      }
    },
    [swapAssets, outputAsset, setValue]
  );

  const handleOutputAssetChange = useCallback(
    (newValue: AssetIdentifier) => {
      if (idsAreEqual(newValue, inputAsset)) {
        swapAssets();
      } else {
        setValue("outputAsset", newValue);
      }
    },
    [swapAssets, inputAsset, setValue]
  );

  const exchangeRate = useMemo(() => {
    if (inputAssetAmount === undefined || !outputAssetAmount) {
      return undefined;
    }
    const inputAssetElementaryParts = new BigNumber(10).pow(
      selectedInputAsset.decimals
    );
    return new BigNumber(inputAssetAmount)
      .div(outputAssetAmount)
      .multipliedBy(inputAssetElementaryParts)
      .integerValue(BigNumber.ROUND_FLOOR)
      .dividedBy(inputAssetElementaryParts);
  }, [inputAssetAmount, outputAssetAmount, selectedInputAsset.decimals]);

  const handleExchangerChange = useCallback<
    React.ChangeEventHandler<HTMLInputElement>
  >(
    (e) => {
      if (e.target.checked) {
        setValue("exchanger", e.target.value as ExchangerId);
      }
    },
    [setValue]
  );

  return (
    <form onSubmit={handleSubmit(console.log)}>
      <SwapInput
        assetInputName="inputAsset"
        amountInputName="inputAssetAmount"
        formContextValues={formContextValues}
        label="From"
        assets={inputAssets}
        withPercentageButtons
        onAssetChange={handleInputAssetChange}
      />

      <div className="w-full my-6 flex justify-center">
        <button className="my-1" onClick={swapAssets}>
          <SwapVerticalIcon className="w-6 h-auto stroke-2 stroke-current text-blue-500" />
        </button>
      </div>

      <SwapInput
        assetInputName="outputAsset"
        amountInputName="outputAssetAmount"
        defaultAsset={assets[selectedExchanger][1]}
        formContextValues={formContextValues}
        label="To"
        onAssetChange={handleOutputAssetChange}
        assets={outputAssets}
        amountReadOnly
      />

      <div className="my-6">
        <h2 className="text-gray-900 mb-1 text-xl">Through</h2>
        <ExchangerOption
          name="exchanger"
          checked={selectedExchanger === "quipuswap"}
          ref={register({ required: true })}
          onChange={handleExchangerChange}
          value="quipuswap"
          logo={
            <img
              alt=""
              className="w-7 h-auto"
              src={browser.runtime.getURL(
                "misc/exchangers-logos/quipuswap-logo.png"
              )}
            />
          }
          exchangerName="Quipuswap"
          outputEstimation={outputAssetAmounts?.quipuswap}
          assetSymbol={selectedOutputAsset.symbol}
          disabled={assets.quipuswap.length < 2}
        />
        <ExchangerOption
          name="exchanger"
          checked={selectedExchanger === "dexter"}
          ref={register({ required: true })}
          onChange={handleExchangerChange}
          value="dexter"
          logo={
            <img
              alt=""
              className="h-4 w-auto mx-2"
              src={browser.runtime.getURL(
                "misc/exchangers-logos/dexter-logo.svg"
              )}
            />
          }
          exchangerName="Dexter"
          outputEstimation={outputAssetAmounts?.dexter}
          assetSymbol={selectedOutputAsset.symbol}
          disabled={assets.dexter.length < 2}
        />
      </div>

      <table className="w-full text-xs text-gray-500 mb-6 swap-form-table">
        <tbody>
          <tr>
            <td>Fee:</td>
            <td className="text-right text-gray-600">
              {exchangeFeePercentage.toString()}%
            </td>
          </tr>
          <tr>
            <td>Exchange rate:</td>
            <td className="text-right text-gray-600">
              {exchangeRate
                ? `1 ${
                    selectedOutputAsset.symbol
                  } = ${exchangeRate.toString()} ${selectedInputAsset.symbol}`
                : "-"}
            </td>
          </tr>
          <tr>
            <td>Slippage tolerance:</td>
            <td className="justify-end text-gray-600 flex">
              <Controller
                control={control}
                as={SlippageToleranceInput}
                name="tolerancePercentage"
                rules={{ validate: validateTolerancePercentage }}
              />
            </td>
          </tr>
          <tr>
            <td>Minimum received:</td>
            <td className="text-right text-gray-600">
              {minimumReceived
                ? `${minimumReceived.toString()} ${selectedOutputAsset.symbol}`
                : "-"}
            </td>
          </tr>
        </tbody>
      </table>

      <FormSubmitButton
        className="w-full justify-center border-none"
        style={{
          padding: "10px 2rem",
          background: submitDisabled ? "#c2c2c2" : "#4299e1",
        }}
        disabled={submitDisabled}
      >
        Swap
      </FormSubmitButton>
    </form>
  );
};

type ExchangerOptionProps = {
  name: string;
  value: ExchangerId;
  checked: boolean;
  logo: React.ReactNode;
  exchangerName: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  outputEstimation?: BigNumber;
  assetSymbol: string;
  disabled?: boolean;
};

const ExchangerOption = forwardRef<HTMLInputElement, ExchangerOptionProps>(
  (
    {
      name,
      value,
      logo,
      exchangerName,
      outputEstimation,
      assetSymbol,
      onChange,
      disabled,
      checked,
    },
    ref
  ) => {
    return (
      <div
        className={classNames(
          "flex items-center rounded-md mb-2 h-10 exchanger-option",
          checked ? "border-blue-500 border-2" : "border-gray-300 border"
        )}
      >
        <input
          id={`exchanger-input-${value}`}
          name={name}
          onChange={onChange}
          type="radio"
          value={value}
          disabled={disabled}
          checked={checked}
          className="mr-auto hidden"
          ref={ref}
        />
        <label
          className={classNames(
            "pl-12 flex flex-1 relative select-none items-center",
            !disabled && "cursor-pointer"
          )}
          htmlFor={`exchanger-input-${value}`}
        >
          <div className="ml-2">{logo}</div>
          <span className="text-gray-600 text-xs mr-auto">{exchangerName}</span>
          {outputEstimation !== undefined && (
            <span className="text-green-500 text-sm mr-2">
              ~{outputEstimation.toString()}{" "}
              <span className="text-gray-500">{assetSymbol}</span>
            </span>
          )}
        </label>
      </div>
    );
  }
);

type SlippageToleranceInputProps = {
  onChange: (newValue?: number) => void;
  name: string;
  value?: number;
};

const slippageTolerancePresets = [0.5, 1, 3];
const SlippageToleranceInput = forwardRef<
  HTMLInputElement,
  SlippageToleranceInputProps
>(({ onChange, name, value }, ref) => {
  const [customPercentageValue, setCustomPercentageValue] = useState<number>();

  const handlePresetClick = useCallback(
    (newValue: number) => {
      setCustomPercentageValue(undefined);
      onChange(newValue);
    },
    [onChange]
  );

  const handleCustomPercentageChange = useCallback(
    (newValue?: number) => {
      setCustomPercentageValue(newValue);
      onChange(newValue);
    },
    [onChange]
  );

  const assetFieldInactive = value && slippageTolerancePresets.includes(value);

  return (
    <>
      {slippageTolerancePresets.map((preset) => (
        <SlippageTolerancePresetButton
          key={preset}
          active={value === preset}
          value={preset}
          onClick={handlePresetClick}
        />
      ))}
      <div className="w-10">
        <AssetField
          className={classNames(
            "rounded-md p-1 border bg-opacity-0 -mb-2",
            assetFieldInactive ? "border-gray-300" : "border-blue-600"
          )}
          containerClassName="relative"
          style={{
            padding: 1,
            minWidth: "unset",
            fontSize: "0.75rem",
          }}
          name={name}
          ref={ref}
          value={customPercentageValue}
          min={0}
          max={30}
          assetSymbol={
            <span
              className={classNames(
                "absolute text-xs right-1 top-px pointer-events-none",
                assetFieldInactive ? "text-gray-600" : "text-gray-700"
              )}
            >
              %
            </span>
          }
          useDefaultInnerWrapper={false}
          assetDecimals={2}
          onChange={handleCustomPercentageChange}
        />
      </div>
    </>
  );
});

type SlippageTolerancePresetButtonProps = {
  active: boolean;
  onClick: (value: number) => void;
  value: number;
};

const SlippageTolerancePresetButton: React.FC<SlippageTolerancePresetButtonProps> = ({
  active,
  onClick,
  value,
}) => {
  const handleClick = useCallback(() => onClick(value), [onClick, value]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={classNames(
        "rounded-md mr-1 px-1 py-px border leading-tight",
        active ? "border-blue-600 text-gray-700" : "border-gray-300"
      )}
    >
      {value}%
    </button>
  );
};
