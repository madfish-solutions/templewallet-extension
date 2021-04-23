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
  EXCHANGE_XTZ_RESERVE,
  useBalance,
  TEZ_ASSET,
  assetAmountToUSD,
  TempleAsset,
  ExchangerType,
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

function getAssetKey(asset: TempleAsset) {
  switch (asset.type) {
    case TempleAssetType.TEZ:
      return "tez";
    case TempleAssetType.FA2:
      return `${asset.address}_${asset.id}`;
    default:
      return asset.address;
  }
}

const feeLabel = `${toLocalFixed(new BigNumber("0.3"))}%`;

const SwapForm: React.FC = () => {
  const {
    assets,
    quipuswapTokensWhitelist,
    tokensExchangeData,
    tezUsdPrice,
  } = useSwappableAssets();

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
  const prevInputAssetRef = useRef<TempleAsset | undefined>();
  const prevOutputAssetRef = useRef<TempleAsset | undefined>();
  const prevNetworkIdRef = useRef(network.id);

  useEffect(() => {
    const prevInputAsset = prevInputAssetRef.current;
    const prevOutputAsset = prevOutputAssetRef.current;
    if (inputAsset && outputAsset && assetsAreSame(inputAsset, outputAsset)) {
      if (!prevInputAsset || !assetsAreSame(prevInputAsset, inputAsset)) {
        setValue("output", {});
      } else if (
        !prevOutputAsset ||
        !assetsAreSame(prevOutputAsset, outputAsset)
      ) {
        setValue("input", {});
      }
    }
    prevInputAssetRef.current = inputAsset;
    prevOutputAssetRef.current = outputAsset;
  }, [inputAsset, outputAsset, setValue]);

  useEffect(() => {
    if (prevNetworkIdRef.current !== network.id) {
      reset();
    }
    prevNetworkIdRef.current = network.id;
  }, [network.id, reset]);

  const submitDisabled = Object.keys(errors).length !== 0;

  const getOutputTezAmounts = useCallback(
    async (inputAsset: TempleAsset, amount: BigNumber | number) => {
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
    isValidating: outputAssetAmountsLoading,
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

  const outputAssetExchangeData = useMemo(
    () =>
      outputAsset &&
      getAssetExchangeData(
        tokensExchangeData,
        tezUsdPrice,
        outputAsset,
        selectedExchanger
      ),
    [tokensExchangeData, tezUsdPrice, outputAsset, selectedExchanger]
  );

  useEffect(() => {
    const prevOutputAssetAmount = prevOutputAssetAmountRef.current;
    const shouldSetOutputAmount =
      prevOutputAssetAmount && outputAssetAmount
        ? !prevOutputAssetAmount.eq(outputAssetAmount)
        : prevOutputAssetAmount !== outputAssetAmount;
    if (
      shouldSetOutputAmount &&
      !(inputAsset && outputAsset && assetsAreSame(inputAsset, outputAsset))
    ) {
      const usdExchangeRate = outputAssetExchangeData?.usdPrice;
      setValue(
        "output",
        {
          asset: outputAsset,
          amount: outputAssetAmount,
          usdAmount: assetAmountToUSD(outputAssetAmount, usdExchangeRate),
        },
        outputAssetAmount !== undefined
      );
    }
    prevOutputAssetAmountRef.current = outputAssetAmount;
  }, [
    inputAsset,
    outputAssetAmount,
    outputAsset,
    setValue,
    selectedExchanger,
    tokensExchangeData,
    outputAssetExchangeData,
  ]);
  useEffect(() => {
    if (
      (inputAsset &&
        !getAssetExchangeData(
          tokensExchangeData,
          tezUsdPrice,
          inputAsset,
          selectedExchanger
        )) ||
      (outputAsset && !outputAssetExchangeData)
    ) {
      setValue(
        "exchanger",
        ALL_EXCHANGERS_TYPES.find(
          (type) =>
            (!inputAsset ||
              getAssetExchangeData(
                tokensExchangeData,
                tezUsdPrice,
                inputAsset,
                type
              )) &&
            (!outputAsset ||
              getAssetExchangeData(
                tokensExchangeData,
                tezUsdPrice,
                outputAsset,
                type
              ))
        )
      );
    }
  }, [
    inputAsset,
    outputAsset,
    selectedExchanger,
    setValue,
    tokensExchangeData,
    outputAssetExchangeData,
    tezUsdPrice,
  ]);

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

      <div className="w-full my-4 flex justify-center">
        <button onClick={swapAssets} type="button">
          <SwapVerticalIcon className="w-6 h-auto stroke-2 stroke-current text-blue-500" />
        </button>
      </div>

      <Controller
        className="mb-6"
        name="output"
        control={control}
        as={SwapInput}
        disabled={!inputAsset}
        loading={outputAssetAmountsLoading}
        rules={{ validate: validateAssetOutput }}
        // @ts-ignore
        error={errors.output?.message}
        label={<T id="toAsset" />}
        selectedExchanger={selectedExchanger}
        amountReadOnly
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
          <ExchangerOption key={props.value} {...props} />
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
        "rounded-md mr-1 px-1 h-5 border leading-tight flex items-center",
        active ? "border-blue-600 text-gray-700" : "border-gray-300"
      )}
    >
      {value}%
    </button>
  );
};
