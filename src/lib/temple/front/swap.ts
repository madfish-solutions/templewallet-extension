import { useCallback, useMemo } from "react";

import { BigMapAbstraction, TezosToolkit } from "@taquito/taquito";
import BigNumber from "bignumber.js";
import constate from "constate";

import { BCD_NETWORKS_NAMES } from "app/defaults";
import { getBigmapKeys } from "lib/better-call-dev";
import { useRetryableSWR } from "lib/swr";
import {
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

export type TempleAssetWithPrice = TempleAsset & { usdPrice?: number };

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
      }
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
      }
    },
  ],
]);

export const QUIPUSWAP_CONTRACTS = new Map<string, Record<"factory", string>>([
  [
    TempleChainId.Edo2net,
    {
      factory: "KT1W9xQezU2U49ifE7PPWLXnBJ5gNjYTzVUq",
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

export async function getTokenMidPrice(
  tezos: TezosToolkit,
  contractAddress: string,
  type: ExchangerType
) {
  const { tokenPool, xtzPool } = await getParameters(
    tezos,
    contractAddress,
    type
  );
  if (tokenPool.eq(0) || xtzPool.eq(0)) {
    return new BigNumber(0);
  }
  return xtzPool.dividedBy(tokenPool);
}

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
      .div(tokenPool.multipliedBy(1000).plus(tokenAmount.multipliedBy(997)))
      .integerValue(BigNumber.ROUND_FLOOR);
  }
  const fee = floor(tokenAmount.div(333));
  const newTokenPool = tokenPool.plus(tokenAmount).minus(fee);
  const remainder = floor(invariant.div(newTokenPool));
  return xtzPool.minus(remainder);
}

export async function getTokenOutput(
  tezos: TezosToolkit,
  xtzAmount: BigNumber,
  { address, type }: SwapContractDescriptor
) {
  const { tokenPool, xtzPool } = await getParameters(tezos, address, type);
  const invariant = tokenPool.multipliedBy(xtzPool);
  if (invariant.eq(0)) {
    return new BigNumber(0);
  }
  if (type === "dexter") {
    return xtzAmount
      .multipliedBy(997)
      .multipliedBy(tokenPool)
      .div(xtzPool.multipliedBy(1000).plus(xtzAmount.multipliedBy(997)))
      .integerValue(BigNumber.ROUND_FLOOR);
  }
  const newXtzPool = xtzPool.plus(xtzAmount);
  const fee = floor(xtzAmount.div(333));
  const newTokenPool = floor(invariant.dividedBy(newXtzPool.minus(fee)));
  return tokenPool.minus(newTokenPool);
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
        const commonMetadata = {
          ...tokenMetadata,
          name: tokenMetadata.name || shortHash,
          symbol: tokenMetadata.symbol || shortHash,
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
    const tokenListAddress = QUIPUSWAP_CONTRACTS.get(chainId)?.factory;
    if (!tokenListAddress) {
      return {
        quipuswap: [],
        dexter: dexterTokens as TempleToken[],
        quipuswapTokensExchangeContracts: {},
      };
    }
    const tokenListContract = await loadContract(
      tezos,
      tokenListAddress,
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
    const bcdNetworkName = BCD_NETWORKS_NAMES.get(chainId as TempleChainId);
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
      dexter: dexterTokens as TempleToken[],
      quipuswapTokensExchangeContracts,
    };
  }, [tezos, getAssetData, chainId]);

  const { data: swappableTokens } = useRetryableSWR(
    ["swappable-assets", network.id],
    getSwappableTokens,
    { suspense: true }
  );

  const getTokenPrice = useCallback(
    async (
      token: TempleToken,
      contractAddress: string,
      exchangerType: ExchangerType
    ) => {
      if (tezUsdPrice === null) {
        return undefined;
      }
      const midPrice = await getTokenMidPrice(tezos, contractAddress, exchangerType);
      return mutezToTz(
        midPrice.multipliedBy(new BigNumber(10).pow(token.decimals))
      ).multipliedBy(tezUsdPrice);
    },
    [tezos, tezUsdPrice]
  );

  const getTokensPrices = useCallback(async () => {
    return {
      dexter: await Promise.all(
        swappableTokens!.dexter.map((token) =>
          getTokenPrice(
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
          return getTokenPrice(token, contractAddress, "quipuswap");
        })
      ),
    };
  }, [swappableTokens, getTokenPrice, chainId]);

  const {
    data: tokensExchangeRates,
    revalidate: updateTokensPrices,
  } = useRetryableSWR(
    [
      "swappable-assets-exchange-rates",
      network.id,
      !!swappableTokens,
      tezUsdPrice,
    ],
    getTokensPrices,
    { suspense: false }
  );

  const swappableAssetsWithPrices = useMemo<
    Record<ExchangerType, TempleAssetWithPrice[]>
  >(
    () => ({
      dexter: [
        {
          ...TEZ_ASSET,
          usdPrice: tezUsdPrice || undefined,
        },
        ...swappableTokens!.dexter.map<TempleAssetWithPrice>(
          (token, index) => ({
            ...token,
            usdPrice: tokensExchangeRates?.dexter[index]?.toNumber(),
          })
        ),
      ],
      quipuswap: [
        {
          ...TEZ_ASSET,
          usdPrice: tezUsdPrice || undefined,
        },
        ...swappableTokens!.quipuswap.map((token, index) => ({
          ...token,
          usdPrice: tokensExchangeRates?.quipuswap[index]?.toNumber(),
        })),
      ],
    }),
    [swappableTokens, tokensExchangeRates, tezUsdPrice]
  );

  return {
    assets: swappableAssetsWithPrices,
    updateTokensPrices,
    quipuswapTokensExchangeContracts:
      swappableTokens?.quipuswapTokensExchangeContracts || {},
  };
});
