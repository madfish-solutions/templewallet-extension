import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { BigMapAbstraction } from "@taquito/taquito";
import BigNumber from "bignumber.js";
import classNames from "clsx";
import { Controller, FormContextValues, useForm } from "react-hook-form";
import { browser } from "webextension-polyfill-ts";

import AssetField from "app/atoms/AssetField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import { ReactComponent as SwapVerticalIcon } from "app/icons/swap-vertical.svg";
import SwapInput, { AssetIdentifier } from "app/templates/SwapForm/SwapInput";
import { getBigmapKeys, isBcdNetwork } from "lib/better-call-dev";
import { useRetryableSWR } from "lib/swr";
import {
  loadChainId,
  TempleAssetType,
  TempleChainId,
  TEZ_ASSET,
  useAssets,
  useNetwork,
  useTezos,
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

// chainId -> token -> contract
const DEXTER_EXCHANGE_CONTRACTS = new Map<string, Record<string, string>>([
  [
    TempleChainId.Mainnet,
    {
      KT1PWx2mnDueood7fEmfbBDKx1D9BAnnXitn:
        "KT1BGQR7t4izzKZ7eRodKWTodAsM23P38v7N",
      KT1K9gCRgaLRFKTErYt1wVxA3Frb9FjasjTV:
        "KT1AbYeDbjjcAnV1QK7EZUUdqku77CdkTuv6",
      KT1VYsVfmobT7rsMVivvZ4J8i3bPiqz12NaH:
        "KT1D56HQfMmwdopmFLTwNHFJSs6Dsg2didFo",
      KT19at7rQUvyjxnZ2fBv7D9zc8rkyG7gAoU8:
        "KT1PDrBE59Zmxnb8vXRgRAG1XmvTMTs5EDHU",
      KT1LN4LPSqTMS7Sd2CJw4bbDGRkMv2t68Fy9:
        "KT1Tr2eG3eVmPRbymrbU2UppUmKjFPXomGG9",
    },
  ],
  [
    TempleChainId.Edo2net,
    {
      KT1CUg39jQF8mV6nTMqZxjUUZFuz1KXowv3K:
        "KT1BYYLfMjufYwqFtTSYJND7bzKNyK7mjrjM",
      KT1FCMQk44tEP9fm9n5JJEhkSk1TW3XQdaWH:
        "KT1RfTPvrfAQDGAJ7wB71EtwxLQgjmfz59kE",
    },
  ],
]);

const QUIPUSWAP_CONTRACTS = new Map<string, Record<"factory", string>>([
  [
    TempleChainId.Edo2net,
    {
      factory: "KT1W9xQezU2U49ifE7PPWLXnBJ5gNjYTzVUq",
    },
  ],
]);

const dummyExchangeRate = new BigNumber(0.5);
const exchangeFeePercentage = new BigNumber("0.3");

const SwapFormWrapper: React.FC = () => {
  const network = useNetwork();
  const tezos = useTezos();

  const getExchangableTokensIdentifiers = useCallback(async (): Promise<
    SwapFormProps["exchangableTokensIdentifiers"]
  > => {
    const chainId = await loadChainId(network.rpcBaseURL);
    const dexterExchangableTokensIdentifiers = Object.keys(
      DEXTER_EXCHANGE_CONTRACTS.get(chainId) ?? {}
    ).map((tokenAddress) => ({ address: tokenAddress }));
    const tokenListAddress = QUIPUSWAP_CONTRACTS.get(chainId)?.factory;
    if (!tokenListAddress) {
      return {
        quipuswap: [],
        dexter: dexterExchangableTokensIdentifiers,
      };
    }
    const tokenListContract = await tezos.contract.at(tokenListAddress);
    const tokenListStorage = await tokenListContract.storage<any>();
    const tokenToExchange: BigMapAbstraction =
      tokenListStorage.token_to_exchange;
    const pointer = Number(tokenToExchange.toString());
    let outOfKeys = false;
    let tokensIdentifiers: AssetIdentifier[] = [];
    while (!outOfKeys && isBcdNetwork(network.name)) {
      const newKeys = await getBigmapKeys({
        pointer,
        network: network.name,
        size: 20,
        offset: tokensIdentifiers.length,
      });
      outOfKeys = newKeys.length === 0;
      tokensIdentifiers = [
        ...tokensIdentifiers,
        ...newKeys.map(({ data: { key: { children } } }) => ({
          address: children![0].value,
          tokenId: Number(children![1].value),
        })),
      ];
    }
    return {
      quipuswap: tokensIdentifiers,
      dexter: dexterExchangableTokensIdentifiers,
    };
  }, [network, tezos]);
  const { data: exchangableTokensIdentifiers } = useRetryableSWR(
    ["exchangable-tokens-identifiers", network.id],
    getExchangableTokensIdentifiers,
    { suspense: true }
  );

  if (
    Object.values(exchangableTokensIdentifiers!).every(
      (value) => value.length === 0
    )
  ) {
    return <p>Sorry, no exchangers are available for the current network.</p>;
  }

  return (
    <SwapForm exchangableTokensIdentifiers={exchangableTokensIdentifiers!} />
  );
};

export default SwapFormWrapper;

type SwapFormProps = {
  exchangableTokensIdentifiers: Record<ExchangerId, AssetIdentifier[]>;
};

const SwapForm: React.FC<SwapFormProps> = ({
  exchangableTokensIdentifiers,
}) => {
  const defaultExchanger =
    exchangableTokensIdentifiers.dexter.length > 0 ? "dexter" : "quipuswap";
  const defaultOutputAsset = useMemo(() => {
    return exchangableTokensIdentifiers[defaultExchanger][0];
  }, [exchangableTokensIdentifiers, defaultExchanger]);
  const formContextValues = useForm<SwapFormValues>({
    defaultValues: {
      exchanger: defaultExchanger,
      inputAsset: {},
      outputAsset: defaultOutputAsset,
      tolerancePercentage: 1,
    },
  });
  const { handleSubmit, errors, watch, setValue, control } = formContextValues;
  const inputAsset = watch("inputAsset");
  const inputAssetAmount = watch("inputAssetAmount");
  const outputAssetAmount = watch("outputAssetAmount");
  const outputAsset = watch("outputAsset");
  const selectedExchanger = watch("exchanger");
  const tolerancePercentage = watch("tolerancePercentage");
  const { allAssets } = useAssets();

  const inputAssets = useMemo(() => {
    return [TEZ_ASSET, ...allAssets].filter((asset) => {
      if (asset.type === TempleAssetType.TEZ) {
        return true;
      }
      return exchangableTokensIdentifiers![selectedExchanger].some(
        ({ address, tokenId }) =>
          address === asset.address &&
          (asset.type !== TempleAssetType.FA2 || asset.id === tokenId)
      );
    });
  }, [allAssets, exchangableTokensIdentifiers, selectedExchanger]);

  const outputAssets = useMemo(() => {
    if (selectedExchanger === "dexter") {
      return inputAsset.address ? [TEZ_ASSET] : allAssets;
    }
    if (inputAsset.address) {
      return [TEZ_ASSET, ...allAssets].filter((asset) => {
        if (asset.type === TempleAssetType.TEZ) {
          return true;
        }
        if (asset.type === TempleAssetType.FA2) {
          return (
            exchangableTokensIdentifiers.quipuswap.some(
              ({ address, tokenId }) =>
                address === asset.address && tokenId === asset.id
            ) &&
            asset.address !== inputAsset.address &&
            asset.id !== inputAsset.tokenId
          );
        }
        return (
          exchangableTokensIdentifiers.quipuswap.some(
            ({ address }) => address === asset.address
          ) && asset.address !== inputAsset.address
        );
      });
    }
    return allAssets.filter((asset) => asset.type !== TempleAssetType.TEZ);
  }, [
    allAssets,
    inputAsset.address,
    inputAsset.tokenId,
    selectedExchanger,
    exchangableTokensIdentifiers,
  ]);

  const selectedInputAsset = useMemo(
    () =>
      inputAssets.find((asset) => {
        if (asset.type === TempleAssetType.TEZ) {
          return !inputAsset.address;
        }
        if (asset.address !== inputAsset.address) {
          return false;
        }
        return (
          asset.type !== TempleAssetType.FA2 || asset.id === inputAsset.tokenId
        );
      })!,
    [inputAsset, inputAssets]
  );
  const selectedOutputAsset = useMemo(
    () =>
      outputAssets.find((asset) => {
        if (asset.type === TempleAssetType.TEZ) {
          return !outputAsset.address;
        }
        if (asset.address !== outputAsset.address) {
          return false;
        }
        return (
          asset.type !== TempleAssetType.FA2 || asset.id === outputAsset.tokenId
        );
      })!,
    [outputAsset, outputAssets]
  );

  const submitDisabled = Object.keys(errors).length !== 0;

  const minimumReceived = useMemo(() => {
    if (
      ([outputAssetAmount, tolerancePercentage] as (
        | number
        | undefined
      )[]).includes(undefined)
    ) {
      return undefined;
    }
    const tokensParts = new BigNumber(10).pow(selectedOutputAsset.decimals);
    return new BigNumber(
      new BigNumber(outputAssetAmount)
        .multipliedBy(tokensParts)
        .multipliedBy(100 - tolerancePercentage)
        .dividedBy(100)
        .dividedBy(tokensParts)
        .integerValue()
    );
  }, [outputAssetAmount, selectedOutputAsset.decimals, tolerancePercentage]);

  useEffect(() => {
    setValue(
      "outputAssetAmount",
      inputAssetAmount === undefined
        ? undefined
        : new BigNumber(inputAssetAmount)
            .multipliedBy(dummyExchangeRate)
            .toNumber()
    );
  }, [inputAssetAmount, setValue]);
  const swapAssets = useCallback(() => {
    setValue([
      { inputAsset: outputAsset },
      { inputAssetAmount: outputAssetAmount },
      { outputAsset: inputAsset },
    ]);
  }, [inputAsset, outputAsset, outputAssetAmount, setValue]);

  return (
    <form onSubmit={handleSubmit(console.log)}>
      <SwapInput
        assetInputName="inputAsset"
        amountInputName="inputAssetAmount"
        formContextValues={formContextValues}
        assets={inputAssets}
        withPercentageButtons
      />

      <div className="w-full my-7 flex justify-center">
        <button onClick={swapAssets}>
          <SwapVerticalIcon className="w-6 h-auto stroke-2 stroke-current text-blue-500" />
        </button>
      </div>

      <SwapInput
        assetInputName="outputAsset"
        amountInputName="outputAssetAmount"
        formContextValues={formContextValues}
        assets={outputAssets}
        amountReadOnly
      />

      <div className="my-6">
        <h2 className="text-gray-900 mb-1 text-xl">Through</h2>
        <ExchangerOption
          inputName="exchanger"
          control={control}
          watch={watch}
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
          outputEstimation={outputAssetAmount}
          assetSymbol={selectedOutputAsset.symbol}
          disabled={exchangableTokensIdentifiers.quipuswap.length === 0}
        />
        <ExchangerOption
          inputName="exchanger"
          control={control}
          watch={watch}
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
          outputEstimation={outputAssetAmount}
          assetSymbol={selectedOutputAsset.symbol}
          disabled={exchangableTokensIdentifiers.dexter.length === 0}
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
              {dummyExchangeRate
                ? `1 ${selectedOutputAsset.symbol} = ${new BigNumber(1)
                    .div(dummyExchangeRate)
                    .toString()} ${selectedInputAsset.symbol}`
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

type ExchangerOptionProps = Pick<FormContextValues, "control" | "watch"> & {
  inputName: string;
  value: "quipuswap" | "dexter";
  logo: React.ReactNode;
  exchangerName: string;
  outputEstimation?: number;
  assetSymbol: string;
  disabled?: boolean;
};

const ExchangerOption: React.FC<ExchangerOptionProps> = ({
  inputName,
  control,
  value,
  watch,
  logo,
  exchangerName,
  outputEstimation,
  assetSymbol,
  disabled,
}) => {
  const activeValue = watch(inputName);
  const isActive = activeValue === value;

  return (
    <div
      className={classNames(
        "flex items-center rounded-md mb-2 h-10 exchanger-option",
        isActive ? "border-blue-500 border-2" : "border-gray-300 border"
      )}
    >
      <Controller
        control={control}
        as="input"
        id={`exchanger-input-${value}`}
        name={inputName}
        type="radio"
        value={value}
        disabled={disabled}
        checked={isActive}
        className="mr-auto hidden"
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
            ~{outputEstimation}{" "}
            <span className="text-gray-500">{assetSymbol}</span>
          </span>
        )}
      </label>
    </div>
  );
};

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
                "absolute text-xs right-1 pointer-events-none",
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
