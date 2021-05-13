import React, {
  ChangeEvent,
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
import debouncePromise from "debounce-promise";
import { Controller, useForm } from "react-hook-form";
import { browser } from "webextension-polyfill-ts";

import Alert from "app/atoms/Alert";
import AssetField from "app/atoms/AssetField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import Money from "app/atoms/Money";
import { ReactComponent as InfoIcon } from "app/icons/info.svg";
import { ReactComponent as SwapVerticalIcon } from "app/icons/swap-vertical.svg";
import OperationStatus from "app/templates/OperationStatus";
import SwapInput, { SwapInputValue } from "app/templates/SwapForm/SwapInput";
import useSwappableAssets, {
  getAssetExchangeData,
} from "app/templates/SwapForm/useSwappableAssets";
import { useFormAnalytics } from "lib/analytics";
import { toLocalFixed } from "lib/i18n/numbers";
import { T, t } from "lib/i18n/react";
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
  EXCHANGE_XTZ_RESERVE,
  useBalance,
  TEZ_ASSET,
  assetAmountToUSD,
  TempleAsset,
  ExchangerType,
  getMutezInput,
  getTokenInput,
} from "lib/temple/front";
import useTippy from "lib/ui/useTippy";

import styles from "./SwapForm.module.css";

type SwapFormValues = {
  input: SwapInputValue;
  output: SwapInputValue;
  exchanger: ExchangerType;
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

const feeLabel = `${toLocalFixed(new BigNumber("0.3"))}%`;

const SwapForm: React.FC = () => {
  const { assets, quipuswapTokensWhitelist, tokensExchangeData, tezUsdPrice } =
    useSwappableAssets();

  const tezos = useTezos();
  const network = useNetwork();
  const { publicKeyHash: accountPkh } = useAccount();
  const formAnalytics = useFormAnalytics("SwapForm");

  const defaultExchanger = getAssetExchangeData(
    tokensExchangeData,
    tezUsdPrice,
    assets[1],
    "quipuswap"
  )
    ? "quipuswap"
    : "dexter";
  const formContextValues = useForm<SwapFormValues>({
    defaultValues: {
      exchanger: defaultExchanger,
      input: { asset: assets[0] },
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
    reset,
    triggerValidation,
  } = formContextValues;
  const input = watch("input");
  const { asset: inputAsset, amount: inputAssetAmount } = input;
  const output = watch("output");
  const { asset: outputAsset, amount: outputAssetAmount } = output;
  const selectedExchanger = watch("exchanger");
  const tolerancePercentage = watch("tolerancePercentage");

  const [operation, setOperation] = useState<WalletOperation>();
  const [error, setError] = useState<Error>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const prevNetworkIdRef = useRef(network.id);
  const [inputAmountLoading, setInputAmountLoading] = useState(false);
  const [outputAmountLoading, setOutputAmountLoading] = useState(false);
  const [outputAssetAmounts, setOutputAssetAmounts] =
    useState<Partial<Record<ExchangerType, BigNumber>>>();

  useEffect(() => {
    if (prevNetworkIdRef.current !== network.id) {
      reset();
    }
    prevNetworkIdRef.current = network.id;
  }, [network.id, reset]);

  const submitDisabled =
    Object.keys(errors).length !== 0 ||
    inputAmountLoading ||
    outputAmountLoading;

  const getOutputTezAmounts = useCallback(
    async (inputAsset: TempleAsset, amount: BigNumber) => {
      const rawAssetAmount = new BigNumber(amount).multipliedBy(
        new BigNumber(10).pow(inputAsset.decimals)
      );
      const amounts = await Promise.all(
        ALL_EXCHANGERS_TYPES.map(async (exchangerType) => {
          if (inputAsset.type === TempleAssetType.TEZ) {
            return new BigNumber(amount);
          }
          const contractAddress = getAssetExchangeData(
            tokensExchangeData,
            tezUsdPrice,
            inputAsset,
            exchangerType
          )?.exchangeContract;
          if (!contractAddress) {
            return undefined;
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
        Partial<Record<ExchangerType, BigNumber>>
      >(
        (resultPart, exchangerType, index) => ({
          ...resultPart,
          [exchangerType]: amounts[index],
        }),
        {}
      );
    },
    [tezos, tokensExchangeData, tezUsdPrice]
  );

  const getInputTezAmount = useCallback(
    async (
      outputAsset: TempleAsset,
      amount: BigNumber,
      type: ExchangerType
    ) => {
      if (outputAsset.type === TempleAssetType.TEZ) {
        return amount;
      }
      const rawAssetAmount = new BigNumber(amount).multipliedBy(
        new BigNumber(10).pow(outputAsset.decimals)
      );
      const contractAddress = getAssetExchangeData(
        tokensExchangeData,
        tezUsdPrice,
        outputAsset,
        type
      )?.exchangeContract;
      if (!contractAddress) {
        return undefined;
      }

      return mutezToTz(
        await getMutezInput(tezos, rawAssetAmount, {
          address: contractAddress,
          type,
        })
      );
    },
    [tezos, tokensExchangeData, tezUsdPrice]
  );

  const getOutputAmount = useCallback(
    async (tez: BigNumber, outputAsset: TempleAsset, type: ExchangerType) => {
      if (outputAsset.type === TempleAssetType.TEZ) {
        return tez;
      }
      const contractAddress = getAssetExchangeData(
        tokensExchangeData,
        tezUsdPrice,
        outputAsset,
        type
      )?.exchangeContract;
      if (!contractAddress) {
        return undefined;
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
    [tezos, tokensExchangeData, tezUsdPrice]
  );

  const getInputAmount = useCallback(
    async (tez: BigNumber, inputAsset: TempleAsset, type: ExchangerType) => {
      if (inputAsset.type === TempleAssetType.TEZ) {
        return tez;
      }
      const contractAddress = getAssetExchangeData(
        tokensExchangeData,
        tezUsdPrice,
        inputAsset,
        type
      )?.exchangeContract;
      if (!contractAddress) {
        return undefined;
      }
      const inputAssetElementaryParts = new BigNumber(10).pow(
        inputAsset.decimals
      );
      const result = (
        await getTokenInput(tezos, tzToMutez(tez), {
          address: contractAddress,
          type,
        })
      ).div(inputAssetElementaryParts);
      return result;
    },
    [tezos, tokensExchangeData, tezUsdPrice]
  );

  const getInputAssetAmount = useCallback(
    async (
      outputAssetAmount: BigNumber | undefined,
      outputAsset: TempleAsset | undefined
    ) => {
      if (
        outputAssetAmount === undefined ||
        !inputAsset ||
        !outputAsset ||
        assetsAreSame(inputAsset, outputAsset)
      ) {
        return undefined;
      }
      const tezAmount = await getInputTezAmount(
        outputAsset,
        outputAssetAmount,
        selectedExchanger
      );
      if (tezAmount === undefined) {
        return undefined;
      }
      const result = await getInputAmount(
        tezAmount,
        inputAsset,
        selectedExchanger
      );
      return result;
    },
    [getInputAmount, getInputTezAmount, inputAsset, selectedExchanger]
  );

  const getOutputAssetAmounts = useCallback(
    async (
      inputAssetAmount: BigNumber | undefined,
      inputAsset: TempleAsset | undefined
    ) => {
      if (
        inputAssetAmount === undefined ||
        !inputAsset ||
        !outputAsset ||
        assetsAreSame(inputAsset, outputAsset)
      ) {
        return undefined;
      }
      const { dexter: dexterTezAmount, quipuswap: quipuswapTezAmount } =
        await getOutputTezAmounts(inputAsset, inputAssetAmount);
      return {
        dexter:
          dexterTezAmount &&
          (await getOutputAmount(dexterTezAmount, outputAsset, "dexter")),
        quipuswap:
          quipuswapTezAmount &&
          (await getOutputAmount(quipuswapTezAmount, outputAsset, "quipuswap")),
      };
    },
    [getOutputAmount, getOutputTezAmounts, outputAsset]
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

  const swapAssets = useCallback(() => {
    setValue([{ input: output }, { output: input }], true);
  }, [input, output, setValue]);

  const validateTolerancePercentage = useCallback((v?: number) => {
    if (v === undefined) return "";
    if (v < 0) {
      return t("mustBeNonNegative");
    }
    const vBN = new BigNumber(v);
    return (
      vBN.isLessThanOrEqualTo(maxTolerancePercentage) ||
      t("maximalAmount", [maxTolerancePercentage])
    );
  }, []);

  const exchangeRate = useMemo(() => {
    if (
      !inputAssetAmount ||
      !outputAssetAmount ||
      !inputAsset ||
      outputAssetAmount.eq(0)
    ) {
      return undefined;
    }
    const rawExchangeRate = inputAssetAmount.div(outputAssetAmount);
    if (rawExchangeRate.eq(0)) {
      return { base: new BigNumber(1), value: new BigNumber(0) };
    }
    const base = new BigNumber(10).pow(
      BigNumber.max(
        0,
        -Math.floor(Math.log10(rawExchangeRate.toNumber())) -
          inputAsset.decimals
      )
    );
    const prettifiedExchangeRate = rawExchangeRate
      .multipliedBy(base)
      .decimalPlaces(inputAsset.decimals);
    return { base, value: prettifiedExchangeRate };
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
      const analyticsProperties = {
        exchanger,
        inputAsset: inputAsset!.symbol,
        outputAsset: outputAsset!.symbol,
      };
      formAnalytics.trackSubmit(analyticsProperties);
      try {
        setOperation(undefined);
        const inputContractAddress = getAssetExchangeData(
          tokensExchangeData,
          tezUsdPrice,
          inputAsset!,
          exchanger
        )!.exchangeContract;
        const outputContractAddress = getAssetExchangeData(
          tokensExchangeData,
          tezUsdPrice,
          outputAsset!,
          exchanger
        )!.exchangeContract;
        const op = await swap({
          accountPkh,
          inputAsset: inputAsset!,
          inputContractAddress,
          outputAsset: outputAsset!,
          outputContractAddress,
          exchangerType: exchanger,
          inputAmount: inputAmount!,
          tolerance: tolerancePercentage / 100,
          tezos,
        });
        setError(undefined);
        formAnalytics.trackSubmitSuccess(analyticsProperties);
        setOperation(op);
      } catch (e) {
        if (e.message !== "Declined") {
          setError(e);
        }
        formAnalytics.trackSubmitFail(analyticsProperties);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      tezos,
      accountPkh,
      isSubmitting,
      inputAsset,
      outputAsset,
      formAnalytics,
      tokensExchangeData,
      tezUsdPrice,
    ]
  );

  const closeError = useCallback(() => setError(undefined), []);

  const { data: inputAssetBalance } = useBalance(
    inputAsset ?? TEZ_ASSET,
    accountPkh,
    { suspense: false }
  );
  const validateAssetInput = useCallback(
    async ({ asset, amount }: SwapInputValue) => {
      if (!amount || !asset) {
        return "";
      }
      if (amount.eq(0)) {
        return t("amountMustBePositive");
      }
      const balance =
        inputAsset && assetsAreSame(inputAsset, asset) && inputAssetBalance
          ? inputAssetBalance
          : await fetchBalance(tezos, asset, accountPkh);
      if (
        asset.type === TempleAssetType.TEZ &&
        amount.lte(balance) &&
        balance.minus(amount).lt(EXCHANGE_XTZ_RESERVE)
      ) {
        return `amountReserved:${EXCHANGE_XTZ_RESERVE.toString()}`;
      }
      return (
        amount.isLessThanOrEqualTo(balance) ||
        `maximalAmount:${toLocalFixed(balance)}`
      );
    },
    [accountPkh, tezos, inputAsset, inputAssetBalance]
  );

  const validateAssetOutput = useCallback(
    ({ asset, amount }: SwapInputValue) => {
      if (!amount || !asset) {
        return "";
      }
      if (inputAsset && assetsAreSame(asset, inputAsset)) {
        return t("inputOutputAssetsCannotBeSame");
      }
      if (amount.eq(0)) {
        return t("amountMustBePositive");
      }
      const maxExchangable =
        asset.type === TempleAssetType.TEZ
          ? new BigNumber(Infinity)
          : getAssetExchangeData(
              tokensExchangeData,
              tezUsdPrice,
              asset,
              selectedExchanger
            )?.maxExchangable ?? new BigNumber(Infinity);
      return (
        amount.lte(maxExchangable) ||
        `maximalAmount:${toLocalFixed(maxExchangable)}`
      );
    },
    [selectedExchanger, inputAsset, tokensExchangeData, tezUsdPrice]
  );

  const exchangersOptionsProps = useMemo(() => {
    const inputAssetAvailability = ALL_EXCHANGERS_TYPES.reduce(
      (result, exchangerType) => {
        result[exchangerType] =
          !inputAsset ||
          !!getAssetExchangeData(
            tokensExchangeData,
            tezUsdPrice,
            inputAsset,
            exchangerType
          );
        return result;
      },
      { quipuswap: false, dexter: false }
    );
    const outputAssetAvailability = ALL_EXCHANGERS_TYPES.reduce(
      (result, exchangerType) => {
        result[exchangerType] =
          !outputAsset ||
          !!getAssetExchangeData(
            tokensExchangeData,
            tezUsdPrice,
            outputAsset,
            exchangerType
          );
        return result;
      },
      { quipuswap: false, dexter: false }
    );
    const unsortedProps = [
      {
        name: "exchanger",
        checked: selectedExchanger === "quipuswap",
        ref: register({ required: true }),
        value: "quipuswap" as ExchangerType,
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
        disabled:
          !outputAssetAvailability.quipuswap ||
          !inputAssetAvailability.quipuswap,
      },
      {
        name: "exchanger",
        checked: selectedExchanger === "dexter",
        ref: register({ required: true }),
        value: "dexter" as ExchangerType,
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
        disabled:
          !outputAssetAvailability.dexter || !inputAssetAvailability.dexter,
      },
    ];
    const defaultExchangersOrder = ["quipuswap", "dexter"];

    return unsortedProps.sort(
      (
        { outputEstimation: a, value: aExchanger },
        { outputEstimation: b, value: bExchanger }
      ) => {
        if (!!a === !!b) {
          return (
            defaultExchangersOrder.indexOf(aExchanger) -
            defaultExchangersOrder.indexOf(bExchanger)
          );
        }
        if (a) {
          return -1;
        }
        return 1;
      }
    );
  }, [
    outputAssetAmounts,
    register,
    selectedExchanger,
    outputAsset,
    inputAsset,
    tokensExchangeData,
    tezUsdPrice,
  ]);

  const shouldShowNotWhitelistedTokenWarning = useMemo(() => {
    return [inputAsset, outputAsset].some(
      (asset) =>
        asset &&
        asset.type !== TempleAssetType.TEZ &&
        !quipuswapTokensWhitelist.some((whitelistedToken) =>
          assetsAreSame(whitelistedToken, asset)
        )
    );
  }, [quipuswapTokensWhitelist, inputAsset, outputAsset]);

  const resetOperation = useCallback(() => setOperation(undefined), []);

  const feeInfoTippyProps = useMemo(
    () => ({
      trigger: "mouseenter",
      hideOnClick: false,
      content: t("poolExchangeFee"),
      animation: "shift-away-subtle",
    }),
    []
  );
  const feeInfoIconRef = useTippy<HTMLSpanElement>(feeInfoTippyProps);

  const updateOutputValue = useMemo(
    () =>
      debouncePromise(
        async (
          newInputValue: SwapInputValue,
          newExchangerType: ExchangerType
        ) => {
          try {
            const outputAmounts = await getOutputAssetAmounts(
              newInputValue.amount,
              newInputValue.asset
            );
            setOutputAssetAmounts(outputAmounts);
            const newAmount = outputAmounts?.[newExchangerType];
            const exchangeData =
              newInputValue.asset &&
              getAssetExchangeData(
                tokensExchangeData,
                tezUsdPrice,
                newInputValue.asset,
                newExchangerType
              );
            setValue("output", {
              asset: outputAsset,
              amount: newAmount,
              usdAmount: assetAmountToUSD(newAmount, exchangeData?.usdPrice),
            });
          } catch (e) {
            if (process.env.NODE_ENV === "development") {
              console.error(e);
            }
            setValue("output", { asset: outputAsset });
          }
        },
        250
      ),
    [
      outputAsset,
      setValue,
      getOutputAssetAmounts,
      tezUsdPrice,
      tokensExchangeData,
    ]
  );
  const updateInputValue = useMemo(
    () =>
      debouncePromise(async (newOutputValue: SwapInputValue) => {
        try {
          const setValueBatch: Partial<SwapFormValues>[] = [];
          const newAmount = await getInputAssetAmount(
            newOutputValue.amount,
            newOutputValue.asset
          );
          const getExchangeData = (exchanger: ExchangerType) =>
            newOutputValue.asset &&
            getAssetExchangeData(
              tokensExchangeData,
              tezUsdPrice,
              newOutputValue.asset,
              exchanger
            );
          let exchanger = selectedExchanger;
          if (newOutputValue.asset && !getExchangeData(selectedExchanger)) {
            exchanger = ALL_EXCHANGERS_TYPES.find((type) =>
              getExchangeData(type)
            )!;
            setValueBatch.push({ exchanger });
          }
          const exchangeData =
            newOutputValue.asset &&
            getAssetExchangeData(
              tokensExchangeData,
              tezUsdPrice,
              newOutputValue.asset,
              exchanger
            );
          setValueBatch.push({
            input: {
              asset: inputAsset,
              amount: newAmount,
              usdAmount: assetAmountToUSD(newAmount, exchangeData?.usdPrice),
            },
          });
          setValue(setValueBatch);
        } catch (e) {
          if (process.env.NODE_ENV === "development") {
            console.error(e);
          }
          setValue("input", { asset: inputAsset });
        }
      }, 250),
    [
      getInputAssetAmount,
      inputAsset,
      selectedExchanger,
      setValue,
      tezUsdPrice,
      tokensExchangeData,
    ]
  );

  useEffect(() => {
    register("input", { validate: validateAssetInput });
    register("output", { validate: validateAssetOutput });
  }, [register, validateAssetInput, validateAssetOutput, network.id]);
  const handleInputChange = useCallback(
    async (newValue: SwapInputValue) => {
      setValue("input", newValue);
      setOutputAmountLoading(true);
      await updateOutputValue(newValue, selectedExchanger);
      setOutputAmountLoading(false);
    },
    [setValue, updateOutputValue, selectedExchanger]
  );
  const handleOutputChange = useCallback(
    async (newValue: SwapInputValue) => {
      setValue("output", newValue);
      setInputAmountLoading(true);
      await updateInputValue(newValue);
      setInputAmountLoading(false);
    },
    [setValue, updateInputValue]
  );
  const handleExchangerChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value as ExchangerType;
      setValue("exchanger", newValue);
      await updateOutputValue(input, newValue);
    },
    [setValue, updateOutputValue, input]
  );

  return (
    <form className="mb-8" onSubmit={handleSubmit(onSubmit)}>
      {operation && (
        <OperationStatus
          className="mb-6"
          closable
          typeTitle={t("swapNoun")}
          operation={operation}
          onClose={resetOperation}
        />
      )}

      <SwapInput
        name="input"
        // @ts-ignore
        error={errors.input?.message}
        label={<T id="from" />}
        loading={inputAmountLoading}
        onChange={handleInputChange}
        withPercentageButtons
        triggerValidation={triggerValidation}
        selectedExchanger={selectedExchanger}
        value={input}
      />

      <div className="w-full my-4 flex justify-center">
        <button onClick={swapAssets} type="button">
          <SwapVerticalIcon className="w-6 h-auto stroke-2 stroke-current text-blue-500" />
        </button>
      </div>

      <SwapInput
        className="mb-6"
        name="output"
        loading={outputAmountLoading}
        // @ts-ignore
        error={errors.output?.message}
        isOutput
        label={<T id="toAsset" />}
        onChange={handleOutputChange}
        triggerValidation={triggerValidation}
        selectedExchanger={selectedExchanger}
        value={output}
      />

      <div
        className={classNames(
          "mb-6",
          (!inputAsset || !outputAsset) && "hidden"
        )}
      >
        <h2 className="text-gray-900 mb-1 text-xl">
          <T id="via" />
        </h2>
        {exchangersOptionsProps.map((props) => (
          <ExchangerOption
            key={props.value}
            {...props}
            onChange={handleExchangerChange}
          />
        ))}
      </div>

      {shouldShowNotWhitelistedTokenWarning && (
        <p className="mb-6 text-red-700 text-xs">
          <T id="notWhitelistedTokenWarning" />
        </p>
      )}

      <table
        className={classNames(
          "w-full text-xs text-gray-500 mb-1",
          styles["swap-form-table"]
        )}
      >
        <tbody>
          <tr>
            <td>
              <div className="flex items-center">
                <T id="fee" />
                &nbsp;
                <span ref={feeInfoIconRef} className="text-gray-600">
                  <InfoIcon className="w-3 h-auto stroke-current" />
                </span>
                :
              </div>
            </td>
            <td className="text-right text-gray-600">{feeLabel}</td>
          </tr>
          <tr>
            <td>
              <T id="exchangeRate" />
            </td>
            <td className="text-right text-gray-600">
              {inputAsset && outputAsset && exchangeRate
                ? `${exchangeRate.base} ${outputAsset.symbol} = ${toLocalFixed(
                    exchangeRate.value
                  )} ${inputAsset.symbol}`
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
                ? `${toLocalFixed(minimumReceived)} ${outputAsset.symbol}`
                : "-"}
            </td>
          </tr>
        </tbody>
      </table>

      <p className="text-xs text-gray-600 mb-6">
        {t("templeWalletFeeWarning")}
      </p>

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
  value: ExchangerType;
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
    const cryptoDecimals = useMemo(() => {
      if (!outputEstimation) {
        return undefined;
      }
      const exponentialPart = Number(
        outputEstimation.toExponential().split("e")[1]
      );
      return exponentialPart < -3 ? 3 - exponentialPart : undefined;
    }, [outputEstimation]);

    return (
      <div
        className={classNames(
          "flex items-center rounded-md mb-2 h-10",
          styles["exchanger-option"],
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
          <div style={{ marginLeft: checked ? "0.25rem" : "0.3125rem" }}>
            {logo}
          </div>
          <span className="text-gray-600 text-xs mr-auto">{exchangerName}</span>
          {outputEstimation !== undefined && (
            <span className="text-green-500 text-sm mr-2">
              ~<Money cryptoDecimals={cryptoDecimals}>{outputEstimation}</Money>{" "}
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
    (newValue?: string) => {
      const newValueNum = newValue ? Number(newValue) : undefined;
      setCustomPercentageValue(newValueNum);
      onChange(newValueNum);
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
            padding: "0.09375rem 0.875rem 0.09375rem 0.25rem",
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

const SlippageTolerancePresetButton: React.FC<SlippageTolerancePresetButtonProps> =
  ({ active, onClick, value }) => {
    const handleClick = useCallback(() => onClick(value), [onClick, value]);

    return (
      <button
        type="button"
        onClick={handleClick}
        className={classNames(
          "rounded-md mr-1 px-1 h-5 border leading-tight flex items-center",
          active ? "border-blue-600 text-gray-700" : "border-gray-300"
        )}
      >
        {value}%
      </button>
    );
  };
