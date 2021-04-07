import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
import useSwappableAssets from "app/templates/SwapForm/useSwappableAssets";
import { T, t } from "lib/i18n/react";
import { useRetryableSWR } from "lib/swr";
import {
  TempleAssetType,
  useNetwork,
  getTokenOutput,
  useTezos,
  tzToMutez,
  getMutezOutput,
  mutezToTz,
  ALL_EXCHANGERS_TYPES,
  useAccount,
  swap,
  fetchBalance,
  assetsAreSame,
  TempleAssetWithExchangeData,
  EXCHANGE_XTZ_RESERVE,
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
  const { isSupportedNetwork } = useSwappableAssets();

  if (!isSupportedNetwork) {
    return (
      <p className="text-center text-sm">
        <T id="noExchangersAvailable" />
      </p>
    );
  }

  return <SwapForm />;
};

export default SwapFormWrapper;

function getAssetKey(asset: TempleAssetWithExchangeData) {
  switch (asset.type) {
    case TempleAssetType.TEZ:
      return "tez";
    case TempleAssetType.FA2:
      return `${asset.address}_${asset.id}`;
    default:
      return asset.address;
  }
}

const SwapForm: React.FC = () => {
  const { assets } = useSwappableAssets();
  const tezos = useTezos();
  const network = useNetwork();
  const { publicKeyHash: accountPkh } = useAccount();

  const defaultExchanger = assets[1].quipuswap ? "quipuswap" : "dexter";
  const formContextValues = useForm<SwapFormValues>({
    defaultValues: {
      exchanger: defaultExchanger,
      input: {},
      output: {},
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
  const { asset: inputAsset, amount: inputAssetAmount } = input;
  const output = watch("output");
  const { asset: outputAsset } = output;
  const selectedExchanger = watch("exchanger");
  const tolerancePercentage = watch("tolerancePercentage");

  const [operation, setOperation] = useState<WalletOperation>();
  const [error, setError] = useState<Error>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitDisabled = Object.keys(errors).length !== 0;

  const getOutputTezAmounts = useCallback(
    async (
      inputAsset: TempleAssetWithExchangeData,
      amount: BigNumber | number
    ) => {
      const rawAssetAmount = new BigNumber(amount).multipliedBy(
        new BigNumber(10).pow(inputAsset.decimals)
      );
      const amounts = await Promise.all(
        ALL_EXCHANGERS_TYPES.map(async (exchangerType) => {
          const contractAddress = inputAsset[exchangerType]?.exchangeContract;
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
    [tezos]
  );

  const getOutputAmount = useCallback(
    async (
      tez: BigNumber,
      outputAsset: TempleAssetWithExchangeData,
      type: ExchangerId
    ) => {
      const contractAddress = outputAsset[type]?.exchangeContract;
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
    [tezos]
  );

  const getOutputAssetAmounts = useCallback(async () => {
    if (
      inputAssetAmount === undefined ||
      !inputAsset ||
      !outputAsset ||
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
    // revalidate: updateOutputAssetAmount,
  } = useRetryableSWR(
    [
      "swap-output",
      outputAsset && getAssetKey(outputAsset),
      inputAsset && getAssetKey(inputAsset),
      inputAssetAmount?.toString(),
      network.id,
    ],
    getOutputAssetAmounts,
    { suspense: false }
  );

  const outputAssetAmount = outputAssetAmounts?.[selectedExchanger];
  const prevOutputAssetAmountRef = useRef<BigNumber | undefined>(
    outputAssetAmount
  );

  const minimumReceived = useMemo(() => {
    if (
      [outputAssetAmount, tolerancePercentage, outputAsset].includes(undefined)
    ) {
      return undefined;
    }
    const tokensParts = new BigNumber(10).pow(outputAsset!.decimals);
    return new BigNumber(outputAssetAmount!)
      .multipliedBy(tokensParts)
      .multipliedBy(100 - tolerancePercentage)
      .idiv(100)
      .dividedBy(tokensParts);
  }, [outputAssetAmount, outputAsset, tolerancePercentage]);

  useEffect(() => {
    const prevOutputAssetAmount = prevOutputAssetAmountRef.current;
    const shouldSetOutputAmount =
      prevOutputAssetAmount && outputAssetAmount
        ? !prevOutputAssetAmount.eq(outputAssetAmount)
        : prevOutputAssetAmount !== outputAssetAmount;
    if (shouldSetOutputAmount) {
      setValue(
        "output",
        {
          asset: outputAsset,
          amount: outputAssetAmount,
        },
        outputAssetAmount !== undefined
      );
    }
    prevOutputAssetAmountRef.current = outputAssetAmount;
  }, [outputAssetAmount, outputAsset, setValue]);
  useEffect(() => {
    if (
      (inputAsset && !inputAsset[selectedExchanger]) ||
      (outputAsset && !outputAsset[selectedExchanger])
    ) {
      setValue(
        "exchanger",
        ALL_EXCHANGERS_TYPES.find(
          (type) =>
            (!inputAsset || inputAsset[type]) &&
            (!outputAsset || outputAsset[type])
        )
      );
    }
  }, [inputAsset, outputAsset, selectedExchanger, setValue]);

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
    if (inputAssetAmount === undefined || !outputAssetAmount || !inputAsset) {
      return undefined;
    }
    const inputAssetElementaryParts = new BigNumber(10).pow(
      inputAsset.decimals
    );
    return new BigNumber(inputAssetAmount)
      .multipliedBy(inputAssetElementaryParts)
      .idiv(outputAssetAmount)
      .dividedBy(inputAssetElementaryParts);
  }, [inputAssetAmount, outputAssetAmount, inputAsset]);

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
          inputAsset: inputAsset!,
          inputContractAddress: inputAsset![exchanger]!.exchangeContract!,
          outputAsset: outputAsset!,
          outputContractAddress: outputAsset![exchanger]!.exchangeContract!,
          exchangerType: exchanger,
          inputAmount: inputAmount!,
          tolerance: tolerancePercentage / 100,
          tezos,
        });
        setError(undefined);
        setOperation(op);
      } catch (e) {
        if (e.message !== "Declined") {
          setError(e);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [tezos, accountPkh, isSubmitting, inputAsset, outputAsset]
  );

  const closeError = useCallback(() => setError(undefined), []);

  const validateAssetInput = useCallback(
    async ({ asset, amount }: SwapInputValue) => {
      if (!amount || !asset) {
        return t("required");
      }
      if (amount.eq(0)) {
        return t("amountMustBePositive");
      }
      const balance = await fetchBalance(tezos, asset, accountPkh);
      if (
        asset.type === TempleAssetType.TEZ &&
        amount.lte(balance) &&
        balance.minus(amount).lt(EXCHANGE_XTZ_RESERVE)
      ) {
        return t(
          "amountMustBeReservedForNetworkFees",
          EXCHANGE_XTZ_RESERVE.toString()
        );
      }
      return (
        amount.isLessThanOrEqualTo(balance) ||
        t("maximalAmount", balance.toFixed())
      );
    },
    [accountPkh, tezos]
  );

  const validateAssetOutput = useCallback(
    ({ asset, amount }: SwapInputValue) => {
      if (!amount || !asset) {
        return t("required");
      }
      if (inputAsset && assetsAreSame(asset, inputAsset)) {
        return t("inputOutputAssetsCannotBeSame");
      }
      if (amount.eq(0)) {
        return t("amountMustBePositive");
      }
      const maxExchangable =
        asset[selectedExchanger]?.maxExchangable ?? new BigNumber(Infinity);
      return (
        amount.lte(maxExchangable) ||
        t("maximalAmount", maxExchangable.toFixed())
      );
    },
    [selectedExchanger, inputAsset]
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
        assetSymbol: outputAsset?.symbol ?? "",
        disabled: !outputAsset?.quipuswap || !inputAsset?.quipuswap,
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
        assetSymbol: outputAsset?.symbol ?? "",
        disabled: !outputAsset?.dexter || !inputAsset?.dexter,
      },
    ];

    return unsortedProps.sort(
      (
        { outputEstimation: a = new BigNumber(0) },
        { outputEstimation: b = new BigNumber(0) }
      ) => b.minus(a).toNumber()
    );
  }, [
    outputAssetAmounts,
    register,
    selectedExchanger,
    outputAsset,
    inputAsset,
  ]);

  return (
    <form className="mb-8" onSubmit={handleSubmit(onSubmit)}>
      {operation && (
        <OperationStatus
          className="mb-6"
          typeTitle={t("swapNoun")}
          operation={operation}
        />
      )}

      <Controller
        name="input"
        control={control}
        as={SwapInput}
        rules={{ validate: validateAssetInput }}
        // @ts-ignore
        error={errors.input?.message}
        label={<T id="from" />}
        withPercentageButtons
        selectedExchanger={selectedExchanger}
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
        disabled={!inputAsset}
        rules={{ validate: validateAssetOutput }}
        // @ts-ignore
        error={errors.output?.message}
        label={<T id="toAsset" />}
        selectedExchanger={selectedExchanger}
        shouldFilterAssetsByExchanger
        amountReadOnly
      />

      <div
        className={classNames(
          "my-6",
          (!inputAsset || !outputAsset) && "hidden"
        )}
      >
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
              {inputAsset && outputAsset && exchangeRate
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
              {minimumReceived && outputAsset
                ? `${minimumReceived.toString()} ${outputAsset.symbol}`
                : "-"}
            </td>
          </tr>
        </tbody>
      </table>

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
