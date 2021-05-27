import { useCallback } from "react";

import BigNumber from "bignumber.js";

import useSwappableAssets, {
  getAssetExchangeData,
} from "app/templates/SwapForm/useSwappableAssets";
import {
  ALL_EXCHANGERS_TYPES,
  assetsAreSame,
  ExchangerType,
  getMutezInput,
  getMutezOutput,
  getTokenInput,
  getTokenOutput,
  mutezToTz,
  tzToMutez,
  useTezos,
} from "lib/temple/front";
import { TempleAsset, TempleAssetType } from "lib/temple/types";

export default function useSwapCalculations() {
  const { tokensExchangeData, tezUsdPrice } = useSwappableAssets();

  const tezos = useTezos();

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
      outputAsset: TempleAsset | undefined,
      inputAsset: TempleAsset | undefined,
      selectedExchanger: ExchangerType
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
    [getInputAmount, getInputTezAmount]
  );

  const getOutputAssetAmounts = useCallback(
    async (
      inputAssetAmount: BigNumber | undefined,
      inputAsset: TempleAsset | undefined,
      outputAsset: TempleAsset | undefined
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
    [getOutputAmount, getOutputTezAmounts]
  );

  return {
    getInputAssetAmount,
    getOutputAssetAmounts,
  };
}
