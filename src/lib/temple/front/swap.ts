import { useCallback, useMemo } from "react";

import { BigMapAbstraction, TezosToolkit } from "@taquito/taquito";
import BigNumber from "bignumber.js";
import constate from "constate";

import { BCD_NETWORKS_NAMES } from "app/defaults";
import { getBigmapKeys } from "lib/better-call-dev";
import { useRetryableSWR } from "lib/swr";
import {
  batchify,
  fetchTokenMetadata,
  loadContract,
  mutezToTz,
  TEZ_ASSET,
  useAssets,
  useNetwork,
  useTokens,
  useTezos,
  useChainId,
  useUSDPrice,
  withTokenApprove,
} from "lib/temple/front";
import {
  TempleAsset,
  TempleAssetType,
  TempleChainId,
  TempleToken,
} from "lib/temple/types";

export type ExchangerType = "dexter" | "quipuswap";

type SwapContractDescriptor = {
  type: ExchangerType;
  address: string;
};

export type AssetIdentifier = { address?: string; tokenId?: number };

export type SwapParams = {
  accountPkh: string;
  inputAsset: TempleAsset;
  inputContractAddress?: string;
  outputAsset: TempleAsset;
  outputContractAddress?: string;
  exchangerType: ExchangerType;
  inputAmount: number;
  tolerance: number;
  tezos: TezosToolkit;
};

export type TempleAssetWithExchangeData = TempleAsset & {
  usdPrice?: number;
  maxExchangable?: BigNumber;
};

export const ALL_EXCHANGERS_TYPES: ExchangerType[] = ["dexter", "quipuswap"];

// chainId -> token -> contract
export const DEXTER_EXCHANGE_CONTRACTS = new Map<
  string,
  Record<string, Record<number, string>>
>([
  [
    TempleChainId.Mainnet,
    {
      KT1PWx2mnDueood7fEmfbBDKx1D9BAnnXitn: {
        0: "KT1BGQR7t4izzKZ7eRodKWTodAsM23P38v7N",
      },
      KT1K9gCRgaLRFKTErYt1wVxA3Frb9FjasjTV: {
        0: "KT1AbYeDbjjcAnV1QK7EZUUdqku77CdkTuv6",
      },
      KT1VYsVfmobT7rsMVivvZ4J8i3bPiqz12NaH: {
        0: "KT1D56HQfMmwdopmFLTwNHFJSs6Dsg2didFo",
      },
      KT19at7rQUvyjxnZ2fBv7D9zc8rkyG7gAoU8: {
        0: "KT1PDrBE59Zmxnb8vXRgRAG1XmvTMTs5EDHU",
      },
      KT1LN4LPSqTMS7Sd2CJw4bbDGRkMv2t68Fy9: {
        0: "KT1Tr2eG3eVmPRbymrbU2UppUmKjFPXomGG9",
      },
    },
  ],
  [
    TempleChainId.Edo2net,
    {
      KT1CUg39jQF8mV6nTMqZxjUUZFuz1KXowv3K: {
        0: "KT1BYYLfMjufYwqFtTSYJND7bzKNyK7mjrjM",
      },
      KT1FCMQk44tEP9fm9n5JJEhkSk1TW3XQdaWH: {
        0: "KT1RfTPvrfAQDGAJ7wB71EtwxLQgjmfz59kE",
      },
    },
  ],
]);

export const QUIPUSWAP_CONTRACTS = new Map<
  string,
  Partial<Record<"fa12Factory" | "fa2Factory", string>>
>([
  [
    TempleChainId.Edo2net,
    {
      fa2Factory: "KT19RP5Um8z7WA8qZzri3YxyhG1R5LdPdNqG",
    },
  ],
]);

export function matchesAsset(assetId: AssetIdentifier, asset: TempleAsset) {
  if (asset.type === TempleAssetType.TEZ) {
    return !assetId.address;
  }
  if (assetId.address !== asset.address) {
    return false;
  }
  return asset.type !== TempleAssetType.FA2 || assetId.tokenId === asset.id;
}

export function getAssetId(asset: TempleAsset): AssetIdentifier {
  switch (asset.type) {
    case TempleAssetType.TEZ:
      return {};
    case TempleAssetType.FA2:
      return { address: asset.address, tokenId: asset.id };
    default:
      return { address: asset.address };
  }
}

export function idsAreEqual(id1: AssetIdentifier, id2: AssetIdentifier) {
  return id1.address === id2.address && id1.tokenId === id2.tokenId;
}

function floor(x: BigNumber) {
  return x.integerValue(BigNumber.ROUND_FLOOR);
}

async function getParameters(
  tezos: TezosToolkit,
  contractAddress: string,
  type: ExchangerType
): Promise<{ tokenPool: BigNumber; xtzPool: BigNumber }> {
  const contract = await loadContract(tezos, contractAddress, false);
  const storage = await contract.storage<any>();
  if (type === "dexter") {
    return {
      tokenPool: storage.tokenPool,
      xtzPool: storage.xtzPool,
    };
  }

  return {
    tokenPool: storage.storage.token_pool,
    xtzPool: storage.storage.tez_pool,
  };
}

const QUIPUSWAP_FEE_RATE = 333;

export async function getMutezOutput(
  tezos: TezosToolkit,
  tokenAmount: BigNumber,
  { address, type }: SwapContractDescriptor
) {
  const { tokenPool, xtzPool } = await getParameters(tezos, address, type);
  const invariant = tokenPool.multipliedBy(xtzPool);
  if (invariant.eq(0)) {
    return new BigNumber(0);
  }
  if (type === "dexter") {
    return tokenAmount
      .multipliedBy(997)
      .multipliedBy(xtzPool)
      .idiv(tokenPool.multipliedBy(1000).plus(tokenAmount.multipliedBy(997)));
  }
  const fee = tokenAmount.idiv(QUIPUSWAP_FEE_RATE);
  const tempTokenPool = tokenPool.plus(tokenAmount).minus(fee);
  const remainder = invariant.idiv(tempTokenPool);
  return xtzPool.minus(remainder);
}

export async function getTokenOutput(
  tezos: TezosToolkit,
  mutezAmount: BigNumber,
  { address, type }: SwapContractDescriptor
) {
  const { tokenPool, xtzPool } = await getParameters(tezos, address, type);
  const invariant = tokenPool.multipliedBy(xtzPool);
  if (invariant.eq(0)) {
    return new BigNumber(0);
  }
  if (type === "dexter") {
    return mutezAmount
      .multipliedBy(997)
      .multipliedBy(tokenPool)
      .idiv(xtzPool.multipliedBy(1000).plus(mutezAmount.multipliedBy(997)));
  }
  const newXtzPool = xtzPool.plus(mutezAmount);
  const fee = mutezAmount.idiv(QUIPUSWAP_FEE_RATE);
  const newTokenPool = invariant.idiv(newXtzPool.minus(fee));
  return tokenPool.minus(newTokenPool);
}

export async function swap({
  accountPkh,
  inputAsset,
  inputContractAddress,
  outputAsset,
  outputContractAddress,
  exchangerType,
  inputAmount,
  tolerance,
  tezos,
}: SwapParams) {
  const transactionsBatch = tezos.wallet.batch([]);
  const rawInputAssetAmount = new BigNumber(inputAmount).multipliedBy(
    new BigNumber(10).pow(inputAsset.decimals)
  );
  const inputIsTz = inputAsset.type === TempleAssetType.TEZ;
  const outputIsTz = outputAsset.type === TempleAssetType.TEZ;
  const maxMutez = inputIsTz
    ? rawInputAssetAmount
    : await getMutezOutput(tezos, rawInputAssetAmount, {
        address: inputContractAddress!,
        type: exchangerType,
      });
  const deadline = Math.floor(Date.now() / 1000) + 30 * 60 * 1000;
  const toleranceQuotient = new BigNumber(1).minus(tolerance);
  const tokenToTokenMiddleQuotient = toleranceQuotient.sqrt();
  if (inputAsset.type !== TempleAssetType.TEZ) {
    const exchangeContract = await loadContract(tezos, inputContractAddress!);
    const mutezOutput = BigNumber.max(
      floor(
        maxMutez.multipliedBy(
          outputIsTz ? toleranceQuotient : tokenToTokenMiddleQuotient
        )
      ),
      1
    );
    const exchangeOperations = [
      exchangerType === "quipuswap"
        ? exchangeContract.methods
            .tokenToTezPayment(
              rawInputAssetAmount.toNumber(),
              mutezOutput.toNumber(),
              accountPkh
            )
            .toTransferParams()
        : exchangeContract.methods
            .tokenToXtz(
              accountPkh,
              accountPkh,
              rawInputAssetAmount.toNumber(),
              mutezOutput.toNumber(),
              deadline.toString()
            )
            .toTransferParams(),
    ];
    batchify(
      transactionsBatch,
      await withTokenApprove(tezos, exchangeOperations, {
        tokenAddress: inputAsset.address,
        tokenId:
          inputAsset.type === TempleAssetType.FA2 ? inputAsset.id : undefined,
        from: accountPkh,
        to: inputContractAddress!,
        value: rawInputAssetAmount,
      })
    );
  }
  if (outputAsset.type !== TempleAssetType.TEZ) {
    const exchangeContract = await loadContract(tezos, outputContractAddress!);
    const maxTokensOutput = await getTokenOutput(tezos, maxMutez, {
      address: outputContractAddress!,
      type: exchangerType,
    });
    const tokensOutput = BigNumber.max(
      floor(maxTokensOutput.multipliedBy(toleranceQuotient)),
      1
    );
    batchify(transactionsBatch, [
      exchangerType === "quipuswap"
        ? exchangeContract.methods
            .tezToTokenPayment(tokensOutput.toNumber(), accountPkh)
            .toTransferParams({ amount: mutezToTz(maxMutez).toNumber() })
        : exchangeContract.methods
            .xtzToToken(
              accountPkh,
              tokensOutput.toNumber(),
              deadline.toString()
            )
            .toTransferParams({ amount: mutezToTz(maxMutez).toNumber() }),
    ]);
  }
  return transactionsBatch.send();
}

export const [SwappableAssetsProvider, useSwappableAssets] = constate(() => {
  const { allAssets: allVisibleAssets } = useAssets();
  const { hiddenTokens } = useTokens();
  const tezos = useTezos();
  const network = useNetwork();
  const tezUsdPrice = useUSDPrice();
  const chainId = useChainId(true)!;

  const allStoredAssets = useMemo(
    () => [...allVisibleAssets, ...hiddenTokens],
    [allVisibleAssets, hiddenTokens]
  );

  const getAssetData = useCallback(
    async (assetId: AssetIdentifier): Promise<TempleAsset> => {
      const { address, tokenId } = assetId;
      if (!address) {
        return TEZ_ASSET;
      }
      let assetFromStorage = allStoredAssets.find((asset) =>
        matchesAsset(assetId, asset)
      );
      if (assetFromStorage) {
        return assetFromStorage;
      }
      const shortHash = `${address.slice(0, 7)}...${address.slice(-4)}`;
      try {
        const tokenMetadata = await fetchTokenMetadata(tezos, address, tokenId);
        const { name: parsedName, symbol: parsedSymbol } = tokenMetadata;
        const commonMetadata = {
          ...tokenMetadata,
          name: !parsedName || parsedName === "???" ? shortHash : parsedName,
          symbol:
            !parsedSymbol || parsedSymbol === "???" ? shortHash : parsedSymbol,
          address,
          fungible: true,
          status: "hidden" as const,
        };
        if (assetId.tokenId === undefined) {
          return {
            ...commonMetadata,
            type: TempleAssetType.FA1_2,
          };
        }
        return {
          ...commonMetadata,
          type: TempleAssetType.FA2,
          id: assetId.tokenId,
        };
      } catch (e) {
        const commonMetadata = {
          name: shortHash,
          symbol: shortHash,
          address,
          decimals: 0,
          fungible: true,
          status: "hidden" as const,
        };
        if (assetId.tokenId === undefined) {
          return {
            ...commonMetadata,
            type: TempleAssetType.FA1_2,
          };
        }
        return {
          ...commonMetadata,
          type: TempleAssetType.FA2,
          id: assetId.tokenId,
        };
      }
    },
    [allStoredAssets, tezos]
  );

  const getSwappableTokens = useCallback(async (): Promise<
    Record<ExchangerType, TempleToken[]> & {
      quipuswapTokensExchangeContracts: Record<string, Record<number, string>>;
    }
  > => {
    const dexterTokensIdentifiers = Object.keys(
      DEXTER_EXCHANGE_CONTRACTS.get(chainId) ?? {}
    ).map((tokenAddress) => ({ address: tokenAddress }));
    const dexterTokens = await Promise.all(
      dexterTokensIdentifiers.map((id) => getAssetData(id))
    );
    const quipuswapContracts = QUIPUSWAP_CONTRACTS.get(chainId) || {};
    const quipuswapResultFragments = await Promise.all(
      [quipuswapContracts.fa12Factory, quipuswapContracts.fa2Factory].map(
        async (factoryAddress) => {
          if (!factoryAddress) {
            return {
              quipuswap: [],
              quipuswapTokensExchangeContracts: {},
            };
          }

          const tokenListContract = await loadContract(
            tezos,
            factoryAddress,
            false
          );
          const tokenListStorage = await tokenListContract.storage<any>();
          const tokenToExchange: BigMapAbstraction =
            tokenListStorage.token_to_exchange;
          const pointer = Number(tokenToExchange.toString());
          let outOfKeys = false;
          let quipuswapTokensIdentifiers: AssetIdentifier[] = [];
          const quipuswapTokensExchangeContracts: Record<
            string,
            Record<number, string>
          > = {};
          const bcdNetworkName = BCD_NETWORKS_NAMES.get(
            chainId as TempleChainId
          );
          while (!outOfKeys && bcdNetworkName) {
            const newKeys = await getBigmapKeys({
              pointer,
              network: bcdNetworkName,
              size: 20,
              offset: quipuswapTokensIdentifiers.length,
            });
            outOfKeys = newKeys.length === 0;
            quipuswapTokensIdentifiers = [
              ...quipuswapTokensIdentifiers,
              ...newKeys.map(({ data: { key: { value, children } } }) => ({
                address: children ? children[0].value : value,
                tokenId: children ? Number(children[1].value) : undefined,
              })),
            ];
            Object.assign(
              quipuswapTokensExchangeContracts,
              newKeys.reduce(
                (
                  contractsFragment,
                  {
                    data: {
                      key: { value: plainKey, children },
                      value,
                    },
                  }
                ) => {
                  if (value) {
                    const address = children ? children[0].value : plainKey;
                    const tokenId = children ? Number(children[1].value) : 0;
                    contractsFragment[address] = {
                      ...contractsFragment[address],
                      [tokenId]: value.value,
                    };
                  }
                  return contractsFragment;
                },
                {} as Record<string, Record<number, string>>
              )
            );
          }
          return {
            quipuswap: (await Promise.all(
              quipuswapTokensIdentifiers.map((id) => getAssetData(id))
            )) as TempleToken[],
            quipuswapTokensExchangeContracts,
          };
        }
      )
    );

    return {
      ...quipuswapResultFragments.reduce(
        (acc, resultFragment) => ({
          quipuswap: [...acc.quipuswap, ...resultFragment.quipuswap],
          quipuswapTokensExchangeContracts: {
            ...acc.quipuswapTokensExchangeContracts,
            ...resultFragment.quipuswapTokensExchangeContracts,
          },
        }),
        { quipuswap: [], quipuswapTokensExchangeContracts: {} }
      ),
      dexter: dexterTokens as TempleToken[],
    };
  }, [tezos, getAssetData, chainId]);

  const { data: swappableTokens } = useRetryableSWR(
    ["swappable-assets", network.id],
    getSwappableTokens,
    { suspense: true }
  );

  const getTokenExchangeData = useCallback(
    async (
      token: TempleToken,
      contractAddress: string,
      exchangerType: ExchangerType
    ) => {
      const tokenElementaryParts = new BigNumber(10).pow(token.decimals);
      const { tokenPool, xtzPool } = await getParameters(
        tezos,
        contractAddress,
        exchangerType
      );
      if (tezUsdPrice === null) {
        return {
          usdPrice: undefined,
          maxExchangable: tokenPool.idiv(3).div(tokenElementaryParts),
        };
      }
      if (tokenPool.eq(0) || xtzPool.eq(0)) {
        return new BigNumber(0);
      }
      const midPrice =
        tokenPool.eq(0) || xtzPool.eq(0)
          ? new BigNumber(0)
          : xtzPool.dividedBy(tokenPool);
      return {
        usdPrice: mutezToTz(midPrice.multipliedBy(tokenElementaryParts))
          .multipliedBy(tezUsdPrice)
          .toNumber(),
        maxExchangable: tokenPool.idiv(3).div(tokenElementaryParts),
      };
    },
    [tezos, tezUsdPrice]
  );

  const getExchangeData = useCallback(async () => {
    return {
      dexter: await Promise.all(
        swappableTokens!.dexter.map((token) =>
          getTokenExchangeData(
            token,
            DEXTER_EXCHANGE_CONTRACTS.get(chainId)![token.address][
              token.type === TempleAssetType.FA2 ? token.id : 0
            ],
            "dexter"
          )
        )
      ),
      quipuswap: await Promise.all(
        swappableTokens!.quipuswap.map((token) => {
          const contractAddress = swappableTokens!
            .quipuswapTokensExchangeContracts[token.address][
            token.type === TempleAssetType.FA2 ? token.id : 0
          ];
          return getTokenExchangeData(token, contractAddress, "quipuswap");
        })
      ),
    };
  }, [swappableTokens, getTokenExchangeData, chainId]);

  const {
    data: tokensExchangeData,
    revalidate: updateTokensExchangeData,
  } = useRetryableSWR(
    [
      "swappable-assets-exchange-data",
      network.id,
      !!swappableTokens,
      tezUsdPrice,
    ],
    getExchangeData,
    { suspense: false }
  );

  const swappableAssetsWithPrices = useMemo<
    Record<ExchangerType, TempleAssetWithExchangeData[]>
  >(
    () =>
      ALL_EXCHANGERS_TYPES.reduce(
        (resultPart, exchangerType) => ({
          ...resultPart,
          [exchangerType]: [
            {
              ...TEZ_ASSET,
              usdPrice: tezUsdPrice || undefined,
            },
            ...swappableTokens![exchangerType].map<TempleAssetWithExchangeData>(
              (token, index) => ({
                ...token,
                ...tokensExchangeData?.dexter[index],
              })
            ),
          ],
        }),
        { dexter: [], quipuswap: [] }
      ),
    [swappableTokens, tokensExchangeData, tezUsdPrice]
  );

  return {
    assets: swappableAssetsWithPrices,
    updateTokensExchangeData,
    quipuswapTokensExchangeContracts:
      swappableTokens?.quipuswapTokensExchangeContracts || {},
  };
});
