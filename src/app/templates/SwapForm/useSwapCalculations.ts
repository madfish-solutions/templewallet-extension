import { useCallback } from "react";

import BigNumber from "bignumber.js";

import {
  getAssetExchangeData,
  TokenExchangeData,
  useSwappableAssets,
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
  const { exchangeData: tokensExchangeData, tezUsdPrice } =
    useSwappableAssets();

  const tezos = useTezos();

  const getOutputTezAmounts = useCallback(
    async (
      inputAsset: TempleAsset,
      amount: BigNumber,
      tokenExchangeData?: Partial<TokenExchangeData>
    ) => {
      const rawAssetAmount = new BigNumber(amount).multipliedBy(
        new BigNumber(10).pow(inputAsset.decimals)
      );
      const amounts = await Promise.all(
        ALL_EXCHANGERS_TYPES.map(async (exchangerType) => {
          if (inputAsset.type === TempleAssetType.TEZ) {
            return new BigNumber(amount);
          }
          const contractAddress = (
            tokenExchangeData?.[exchangerType] ??
            getAssetExchangeData(
              tokensExchangeData,
              tezUsdPrice,
              inputAsset,
              exchangerType
            )
          )?.contract;
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
      exchangerType: ExchangerType,
      tokenExchangeData?: Partial<TokenExchangeData>
    ) => {
      if (outputAsset.type === TempleAssetType.TEZ) {
        return amount;
      }
      const rawAssetAmount = new BigNumber(amount).multipliedBy(
        new BigNumber(10).pow(outputAsset.decimals)
      );
      const contractAddress = (
        tokenExchangeData?.[exchangerType] ??
        getAssetExchangeData(
          tokensExchangeData,
          tezUsdPrice,
          outputAsset,
          exchangerType
        )
      )?.contract;
      if (!contractAddress) {
        return undefined;
      }

      return mutezToTz(
        await getMutezInput(tezos, rawAssetAmount, {
          address: contractAddress,
          type: exchangerType,
        })
      );
    },
    [tezos, tokensExchangeData, tezUsdPrice]
  );

  const getOutputAmount = useCallback(
    async (
      tez: BigNumber,
      outputAsset: TempleAsset,
      exchangerType: ExchangerType,
      tokenExchangeData?: Partial<TokenExchangeData>
    ) => {
      if (outputAsset.type === TempleAssetType.TEZ) {
        return tez;
      }
      const contractAddress = (
        tokenExchangeData?.[exchangerType] ??
        getAssetExchangeData(
          tokensExchangeData,
          tezUsdPrice,
          outputAsset,
          exchangerType
        )
      )?.contract;
      if (!contractAddress) {
        return undefined;
      }
      const outputAssetElementaryParts = new BigNumber(10).pow(
        outputAsset.decimals
      );
      return (
        await getTokenOutput(tezos, tzToMutez(tez), {
          address: contractAddress,
          type: exchangerType,
        })
      ).div(outputAssetElementaryParts);
    },
    [tezos, tokensExchangeData, tezUsdPrice]
  );

  const getInputAmount = useCallback(
    async (
      tez: BigNumber,
      inputAsset: TempleAsset,
      exchangerType: ExchangerType,
      tokenExchangeData?: Partial<TokenExchangeData>
    ) => {
      if (inputAsset.type === TempleAssetType.TEZ) {
        return tez;
      }
      const contractAddress = (
        tokenExchangeData?.[exchangerType] ??
        getAssetExchangeData(
          tokensExchangeData,
          tezUsdPrice,
          inputAsset,
          exchangerType
        )
      )?.contract;
      if (!contractAddress) {
        return undefined;
      }
      const inputAssetElementaryParts = new BigNumber(10).pow(
        inputAsset.decimals
      );
      const result = (
        await getTokenInput(tezos, tzToMutez(tez), {
          address: contractAddress,
          type: exchangerType,
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
      selectedExchanger: ExchangerType,
      inputExchangeData?: Partial<TokenExchangeData>,
      outputExchangeData?: Partial<TokenExchangeData>
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
        selectedExchanger,
        outputExchangeData
      );
      if (tezAmount === undefined) {
        return undefined;
      }
      const result = await getInputAmount(
        tezAmount,
        inputAsset,
        selectedExchanger,
        inputExchangeData
      );
      return result;
    },
    [getInputAmount, getInputTezAmount]
  );

  const getOutputAssetAmounts = useCallback(
    async (
      inputAssetAmount: BigNumber | undefined,
      inputAsset: TempleAsset | undefined,
      outputAsset: TempleAsset | undefined,
      inputExchangeData?: Partial<TokenExchangeData>,
      outputExchangeData?: Partial<TokenExchangeData>
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
        await getOutputTezAmounts(
          inputAsset,
          inputAssetAmount,
          inputExchangeData
        );
      return {
        dexter:
          dexterTezAmount &&
          (await getOutputAmount(
            dexterTezAmount,
            outputAsset,
            "dexter",
            outputExchangeData
          )),
        quipuswap:
          quipuswapTezAmount &&
          (await getOutputAmount(
            quipuswapTezAmount,
            outputAsset,
            "quipuswap",
            outputExchangeData
          )),
      };
    },
    [getOutputAmount, getOutputTezAmounts]
  );

  return {
    getInputAssetAmount,
    getOutputAssetAmounts,
  };
}
