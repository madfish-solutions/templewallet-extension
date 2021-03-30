import { useCallback, useMemo } from "react";

import { BigMapAbstraction } from "@taquito/taquito";
import BigNumber from "bignumber.js";
import constate from "constate";

import { BCD_NETWORKS_NAMES } from "app/defaults";
import { getBigmapKeys } from "lib/better-call-dev";
import { useRetryableSWR } from "lib/swr";
import {
  ALL_EXCHANGERS_TYPES,
  AssetIdentifier,
  DEXTER_EXCHANGE_CONTRACTS,
  ExchangerType,
  fetchTokenMetadata,
  getPoolParameters,
  loadContract,
  matchesAsset,
  mutezToTz,
  QUIPUSWAP_CONTRACTS,
  TempleAssetWithExchangeData,
  TEZ_ASSET,
  useAssets,
  useNetwork,
  useTokens,
  useTezos,
  useChainId,
  useUSDPrice,
  assetsAreSame,
} from "lib/temple/front";
import {
  TempleAsset,
  TempleAssetType,
  TempleChainId,
  TempleToken,
} from "lib/temple/types";

export const [SwappableAssetsProvider, useSwappableAssets] = constate(() => {
  const { allAssets: allVisibleAssets } = useAssets();
  const { hiddenTokens } = useTokens();
  const tezos = useTezos();
  const network = useNetwork();
  const tezUsdPrice = useUSDPrice();
  const networkTezUsdPrice = network.type === "main" ? tezUsdPrice : null;
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
      const { tokenPool, xtzPool } = await getPoolParameters(
        tezos,
        contractAddress,
        exchangerType
      );
      if (networkTezUsdPrice === null) {
        return {
          usdPrice: undefined,
          maxExchangable: tokenPool.idiv(3).div(tokenElementaryParts),
        };
      }
      if (tokenPool.eq(0) || xtzPool.eq(0)) {
        return {
          usdPrice: undefined,
          maxExchangable: new BigNumber(0),
        };
      }
      const midPrice =
        tokenPool.eq(0) || xtzPool.eq(0)
          ? new BigNumber(0)
          : xtzPool.dividedBy(tokenPool);
      return {
        usdPrice: mutezToTz(midPrice.multipliedBy(tokenElementaryParts))
          .multipliedBy(networkTezUsdPrice)
          .toNumber(),
        maxExchangable: tokenPool.idiv(3).div(tokenElementaryParts),
      };
    },
    [tezos, networkTezUsdPrice]
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
      networkTezUsdPrice,
    ],
    getExchangeData,
    { suspense: false }
  );

  const swappableAssetsWithPrices = useMemo<TempleAssetWithExchangeData[]>(
    () => [
      {
        ...TEZ_ASSET,
        ...ALL_EXCHANGERS_TYPES.reduce(
          (additionalProps, exchangerType) => ({
            ...additionalProps,
            [exchangerType]: {
              usdPrice: networkTezUsdPrice || undefined,
              maxExchangable: new BigNumber(Infinity),
            },
          }),
          {}
        ),
      },
      ...ALL_EXCHANGERS_TYPES.reduce<TempleAssetWithExchangeData[]>(
        (resultPart, exchangerType) => {
          const exchangerAvailableTokens =
            swappableTokens?.[exchangerType] ?? [];
          exchangerAvailableTokens.forEach((token, tokenIndex) => {
            const index = resultPart.findIndex((addedToken) =>
              assetsAreSame(addedToken, token)
            );
            if (index >= 0) {
              resultPart[index] = {
                ...resultPart[index],
                [exchangerType]:
                  tokensExchangeData?.[exchangerType][tokenIndex] || {},
              };
            } else {
              resultPart.push({
                ...token,
                [exchangerType]:
                  tokensExchangeData?.[exchangerType][tokenIndex] || {},
              });
            }
          });
          return resultPart;
        },
        []
      ),
    ],
    [swappableTokens, tokensExchangeData, networkTezUsdPrice]
  );

  return {
    assets: swappableAssetsWithPrices,
    updateTokensExchangeData,
    quipuswapTokensExchangeContracts:
      swappableTokens?.quipuswapTokensExchangeContracts || {},
  };
});
