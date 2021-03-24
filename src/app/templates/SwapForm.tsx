import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { WalletOperation } from "@taquito/taquito";
import BigNumber from "bignumber.js";
import classNames from "clsx";
import { Controller, useForm } from "react-hook-form";
import { browser } from "webextension-polyfill-ts";

import Alert from "app/atoms/Alert";
import AssetField from "app/atoms/AssetField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import { ReactComponent as SwapVerticalIcon } from "app/icons/swap-vertical.svg";
import OperationStatus from "app/templates/OperationStatus";
import SwapInput, { SwapInputValue } from "app/templates/SwapForm/SwapInput";
import { useSwappableAssets } from "app/templates/SwapForm/SwappableAssetsProvider";
import { T, t } from "lib/i18n/react";
import { useRetryableSWR } from "lib/swr";
import {
  TempleAssetType,
  TEZ_ASSET,
  getAssetId,
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
  useAccount,
  swap,
  useBalance,
  fetchBalance,
  idsAreEqual,
  assetsAreSame,
} from "lib/temple/front";

import "./SwapForm.css";

type ExchangerId = "quipuswap" | "dexter";

type SwapFormValues = {
  input: SwapInputValue;
  output: SwapInputValue;
  exchanger: ExchangerId;
  tolerancePercentage: number;
};

const maxTolerancePercentage = 30;

const SwapFormWrapper: React.FC = () => {
  const { assets } = useSwappableAssets();

  if (Object.values(assets).every((value) => value.length < 2)) {
    return (
      <p>
        <T id="noExchangersAvailable" />
      </p>
    );
  }

  return <SwapForm />;
};

export default SwapFormWrapper;

const SwapForm: React.FC = () => {
  const {
    assets,
    quipuswapTokensExchangeContracts,
    updateTokensExchangeData,
  } = useSwappableAssets();
  const tezos = useTezos();
  const chainId = useChainId(true)!;
  const network = useNetwork();
  const { publicKeyHash: accountPkh } = useAccount();
  const defaultExchanger = assets.quipuswap.length > 1 ? "quipuswap" : "dexter";
  const defaultOutputAsset = assets[defaultExchanger][1];
  const defaultOutputAssetId = useMemo(() => {
    return getAssetId(defaultOutputAsset);
  }, [defaultOutputAsset]);
  const formContextValues = useForm<SwapFormValues>({
    defaultValues: {
      exchanger: defaultExchanger,
      input: { assetId: {} },
      output: { assetId: defaultOutputAssetId },
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
  const input = watch("input");
  const { assetId: inputAssetId, amount: inputAssetAmount } = input;
  const output = watch("output");
  const { assetId: outputAssetId } = output;
  const selectedExchanger = watch("exchanger");
  const tolerancePercentage = watch("tolerancePercentage");

  const [operation, setOperation] = useState<WalletOperation>();
  const [error, setError] = useState<Error>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputAssets = assets[selectedExchanger];
  const outputAssets = assets[selectedExchanger];

  const inputAsset = useMemo(
    () =>
      inputAssets.find((asset) => matchesAsset(inputAssetId, asset)) ||
      TEZ_ASSET,
    [inputAssetId, inputAssets]
  );
  const outputAsset = useMemo(
    () =>
      outputAssets.find((asset) => matchesAsset(outputAssetId, asset)) ||
      assets[selectedExchanger][1],
    [outputAssetId, outputAssets, assets, selectedExchanger]
  );
  const { data: inputAssetBalance } = useBalance(inputAsset, accountPkh);
  const { data: outputAssetBalance } = useBalance(outputAsset, accountPkh);

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
    async (inputAsset: TempleAsset, amount: BigNumber | number) => {
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
              type: exchangerType,
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
    if (
      inputAssetAmount === undefined ||
      assetsAreSame(inputAsset, outputAsset)
    ) {
      return undefined;
    }
    const {
      dexter: dexterTezAmount,
      quipuswap: quipuswapTezAmount,
    } = await getOutputTezAmounts(inputAsset, inputAssetAmount);
    return {
      dexter:
        dexterTezAmount &&
        (await getOutputAmount(dexterTezAmount, outputAsset, "dexter")),
      quipuswap:
        quipuswapTezAmount &&
        (await getOutputAmount(quipuswapTezAmount, outputAsset, "quipuswap")),
    };
  }, [
    getOutputAmount,
    getOutputTezAmounts,
    inputAssetAmount,
    inputAsset,
    outputAsset,
  ]);

  const {
    data: outputAssetAmounts,
    revalidate: updateOutputAssetAmount,
  } = useRetryableSWR(
    [
      "swap-output",
      outputAssetId.address,
      outputAssetId.tokenId,
      inputAssetId.address,
      inputAssetId.tokenId,
      inputAssetAmount?.toString(),
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
    const tokensParts = new BigNumber(10).pow(outputAsset.decimals);
    return new BigNumber(outputAssetAmount!)
      .multipliedBy(tokensParts)
      .multipliedBy(100 - tolerancePercentage)
      .idiv(100)
      .dividedBy(tokensParts);
  }, [outputAssetAmount, outputAsset.decimals, tolerancePercentage]);

  useEffect(() => {
    setValue(
      "output",
      {
        assetId: outputAssetId,
        amount: outputAssetAmount,
      },
      outputAssetAmount !== undefined
    );
  }, [outputAssetAmount, outputAssetId, setValue]);

  const swapAssets = useCallback(() => {
    setValue([{ input: output }, { output: input }]);
  }, [input, output, setValue]);

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

  const exchangeRate = useMemo(() => {
    if (inputAssetAmount === undefined || !outputAssetAmount) {
      return undefined;
    }
    const inputAssetElementaryParts = new BigNumber(10).pow(
      inputAsset.decimals
    );
    return new BigNumber(inputAssetAmount)
      .multipliedBy(inputAssetElementaryParts)
      .idiv(outputAssetAmount)
      .dividedBy(inputAssetElementaryParts);
  }, [inputAssetAmount, outputAssetAmount, inputAsset.decimals]);

  const onSubmit = useCallback(
    async ({
      exchanger,
      tolerancePercentage,
      input: { amount: inputAmount },
    }: SwapFormValues) => {
      if (isSubmitting) {
        return;
      }
      setIsSubmitting(true);
      try {
        setOperation(undefined);
        const op = await swap({
          accountPkh,
          inputAsset,
          inputContractAddress: getContractAddress(inputAsset, exchanger),
          outputAsset: outputAsset,
          outputContractAddress: getContractAddress(outputAsset, exchanger),
          exchangerType: exchanger,
          inputAmount: inputAmount!,
          tolerance: tolerancePercentage / 100,
          tezos,
        });
        setError(undefined);
        setOperation(op);
      } catch (e) {
        console.error(e);
        setError(e);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      tezos,
      accountPkh,
      isSubmitting,
      getContractAddress,
      inputAsset,
      outputAsset,
    ]
  );

  const closeError = useCallback(() => setError(undefined), []);

  const handleRefreshClick = useCallback(() => {
    updateTokensExchangeData();
    updateOutputAssetAmount();
  }, [updateTokensExchangeData, updateOutputAssetAmount]);

  const validateAssetInput = useCallback(
    async ({ assetId, amount }: SwapInputValue) => {
      if (!amount) {
        return t("required");
      }
      if (amount.eq(0)) {
        return t("amountMustBePositive");
      }
      const matchingAsset =
        inputAssets.find((asset) => matchesAsset(assetId, asset)) || TEZ_ASSET;
      const balance = idsAreEqual(assetId, inputAssetId)
        ? inputAssetBalance ?? new BigNumber(0)
        : await fetchBalance(tezos, matchingAsset, accountPkh);
      return (
        amount.isLessThanOrEqualTo(balance) ||
        t("maximalAmount", balance.toFixed())
      );
    },
    [accountPkh, inputAssets, tezos, inputAssetId, inputAssetBalance]
  );

  const validateAssetOutput = useCallback(
    ({ assetId, amount }: SwapInputValue) => {
      if (idsAreEqual(assetId, inputAssetId)) {
        return t("inputOutputAssetsCannotBeSame");
      }
      if (!amount) {
        return t("required");
      }
      if (amount.eq(0)) {
        return t("amountMustBePositive");
      }
      const matchingAsset =
        outputAssets.find((asset) => matchesAsset(assetId, asset)) ||
        assets[selectedExchanger][1];
      const maxExchangable =
        matchingAsset.maxExchangable ?? new BigNumber(Infinity);
      return (
        amount.lte(maxExchangable) ||
        t("maximalAmount", maxExchangable.toFixed())
      );
    },
    [assets, outputAssets, selectedExchanger, inputAssetId]
  );

  const exchangersOptionsProps = useMemo(() => {
    const unsortedProps = [
      {
        name: "exchanger",
        checked: selectedExchanger === "quipuswap",
        ref: register({ required: true }),
        value: "quipuswap" as ExchangerId,
        logo: (
          <img
            alt=""
            className="w-7 h-auto"
            src={browser.runtime.getURL(
              "misc/exchangers-logos/quipuswap-logo.png"
            )}
          />
        ),
        exchangerName: "Quipuswap",
        outputEstimation: outputAssetAmounts?.quipuswap,
        assetSymbol: outputAsset.symbol,
        disabled: assets.quipuswap.length < 2,
      },
      {
        name: "exchanger",
        checked: selectedExchanger === "dexter",
        ref: register({ required: true }),
        value: "dexter" as ExchangerId,
        logo: (
          <img
            alt=""
            className="h-4 w-auto mx-2"
            src={browser.runtime.getURL(
              "misc/exchangers-logos/dexter-logo.svg"
            )}
          />
        ),
        exchangerName: "Dexter",
        outputEstimation: outputAssetAmounts?.dexter,
        assetSymbol: outputAsset.symbol,
        disabled: assets.dexter.length < 2,
      },
    ];

    return unsortedProps.sort(
      (
        { outputEstimation: a = new BigNumber(0) },
        { outputEstimation: b = new BigNumber(0) }
      ) => b.minus(a).toNumber()
    );
  }, [assets, outputAssetAmounts, register, selectedExchanger, outputAsset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="input"
        control={control}
        as={SwapInput}
        rules={{ validate: validateAssetInput }}
        balance={inputAssetBalance}
        // @ts-ignore
        error={errors.input?.message}
        assets={inputAssets}
        label={<T id="from" />}
        onRefreshClick={handleRefreshClick}
        withPercentageButtons
      />

      <div className="w-full my-6 flex justify-center">
        <button className="my-1" onClick={swapAssets} type="button">
          <SwapVerticalIcon className="w-6 h-auto stroke-2 stroke-current text-blue-500" />
        </button>
      </div>

      <Controller
        name="output"
        control={control}
        as={SwapInput}
        rules={{ validate: validateAssetOutput }}
        balance={outputAssetBalance}
        // @ts-ignore
        error={errors.output?.message}
        assets={outputAssets}
        defaultAsset={assets[selectedExchanger][1]}
        amountReadOnly
        label={<T id="toAsset" />}
        onRefreshClick={handleRefreshClick}
      />

      <div className="my-6">
        <h2 className="text-gray-900 mb-1 text-xl">
          <T id="through" />
        </h2>
        {exchangersOptionsProps.map((props) => (
          <ExchangerOption key={props.value} {...props} />
        ))}
      </div>

      <table className="w-full text-xs text-gray-500 mb-6 swap-form-table">
        <tbody>
          <tr>
            <td>
              <T id="fee" />:
            </td>
            <td className="text-right text-gray-600">0.3%</td>
          </tr>
          <tr>
            <td>
              <T id="exchangeRate" />
            </td>
            <td className="text-right text-gray-600">
              {exchangeRate
                ? `1 ${outputAsset.symbol} = ${exchangeRate.toString()} ${
                    inputAsset.symbol
                  }`
                : "-"}
            </td>
          </tr>
          <tr>
            <td>
              <T id="slippageTolerance" />
            </td>
            <td className="justify-end text-gray-600 flex">
              <Controller
                control={control}
                as={SlippageToleranceInput}
                error={!!errors.tolerancePercentage}
                name="tolerancePercentage"
                rules={{ validate: validateTolerancePercentage }}
              />
            </td>
          </tr>
          <tr>
            <td>
              <T id="minimumReceived" />
            </td>
            <td className="text-right text-gray-600">
              {minimumReceived
                ? `${minimumReceived.toString()} ${outputAsset.symbol}`
                : "-"}
            </td>
          </tr>
        </tbody>
      </table>

      {operation && (
        <OperationStatus
          className="mb-6"
          typeTitle={t("swapNoun")}
          operation={operation}
        />
      )}

      {error && (
        <Alert
          className="mb-6"
          type="error"
          title={t("error")}
          description={error.message}
          closable
          onClose={closeError}
        />
      )}

      <FormSubmitButton
        className="w-full justify-center border-none"
        style={{
          padding: "10px 2rem",
          background: submitDisabled ? "#c2c2c2" : "#4299e1",
        }}
        disabled={submitDisabled}
        loading={isSubmitting}
      >
        <T id="swap" />
      </FormSubmitButton>
    </form>
  );
};

type ExchangerOptionProps = {
  name: string;
  value: ExchangerId;
  checked?: boolean;
  logo: React.ReactNode;
  exchangerName: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
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
  error?: boolean;
  onChange: (newValue?: number) => void;
  name: string;
  value?: number;
};

const slippageTolerancePresets = [0.5, 1, 3];
const SlippageToleranceInput = forwardRef<
  HTMLInputElement,
  SlippageToleranceInputProps
>(({ error, onChange, name, value }, ref) => {
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

  const assetFieldActive = !value || !slippageTolerancePresets.includes(value);

  const borderClassName = useMemo(() => {
    switch (true) {
      case error:
        return "border-red-600";
      case assetFieldActive:
        return "border-blue-600";
      default:
        return "border-gray-300";
    }
  }, [assetFieldActive, error]);

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
            "rounded-md border bg-opacity-0 -mb-2 text-right",
            borderClassName
          )}
          containerClassName="relative"
          style={{
            padding: "0.125rem 0.875rem 0.125rem 0.25rem",
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
                "absolute text-xs right-1 pointer-events-none",
                assetFieldActive ? "text-gray-700" : "text-gray-600"
              )}
              style={{ top: "0.125rem" }}
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
