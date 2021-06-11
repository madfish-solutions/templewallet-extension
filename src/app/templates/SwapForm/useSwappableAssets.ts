import { useCallback, useEffect, useMemo, useState } from "react";

import { BigMapAbstraction, TezosToolkit } from "@taquito/taquito";
import { validateAddress, ValidationResult } from "@taquito/utils";
import BigNumber from "bignumber.js";

import { formatImgUri } from "lib/image-uri";
import { getQuipuswapWhitelist } from "lib/quipuswap";
import { useRetryableSWR } from "lib/swr";
import {
  AssetIdentifier,
  DEXTER_EXCHANGE_CONTRACTS,
  ExchangerType,
  fetchTokenMetadata,
  getPoolParameters,
  loadContract,
  matchesAsset,
  QUIPUSWAP_CONTRACTS,
  TEZ_ASSET,
  useAssets,
  useNetwork,
  useTokens,
  useTezos,
  useChainId,
  assetsAreSame,
  ExchangeDataEntry,
  assertFA2TokenContract,
  useStorage,
  useAssetUSDPrice,
} from "lib/temple/front";
import {
  TempleAsset,
  TempleAssetType,
  TempleChainId,
  TempleToken,
} from "lib/temple/types";

export type TokensExchangeData = Record<
  string,
  Record<number, Partial<Record<ExchangerType, ExchangeDataEntry>>>
>;

type SwappableTokensRawData = Record<ExchangerType, TempleToken[]> & {
  quipuswapTokensExchangeContracts: Record<string, Record<number, string>>;
  networkIsSupported: boolean;
  tokenIdRequired: boolean;
};

const DEXTER_INITIAL_TOKENS = new Map<string, TempleToken[]>([
  [
    TempleChainId.Mainnet,
    [
      {
        type: TempleAssetType.FA1_2,
        decimals: 8,
        symbol: "tzBTC",
        name: "tzBTC",
        fungible: true,
        status: "displayed",
        address: "KT1PWx2mnDueood7fEmfbBDKx1D9BAnnXitn",
        iconUrl:
          "https://tzbtc.io/wp-content/uploads/2020/03/tzbtc_logo_single.svg",
      },
      {
        type: TempleAssetType.FA1_2,
        decimals: 18,
        symbol: "KUSD",
        name: "Kolibri",
        fungible: true,
        status: "displayed",
        address: "KT1K9gCRgaLRFKTErYt1wVxA3Frb9FjasjTV",
        iconUrl: "https://kolibri-data.s3.amazonaws.com/logo.png",
      },
      {
        type: TempleAssetType.FA1_2,
        decimals: 6,
        symbol: "wXTZ",
        name: "Wrapped Tezos",
        fungible: true,
        status: "displayed",
        address: "KT1VYsVfmobT7rsMVivvZ4J8i3bPiqz12NaH",
        iconUrl:
          "https://raw.githubusercontent.com/StakerDAO/wrapped-xtz/dev/assets/wXTZ-token-FullColor.png",
      },
      {
        type: TempleAssetType.FA1_2,
        decimals: 18,
        symbol: "ETHtz",
        name: "ETHtez",
        fungible: true,
        status: "displayed",
        address: "KT19at7rQUvyjxnZ2fBv7D9zc8rkyG7gAoU8",
        iconUrl: "https://ethtz.io/ETHtz_purple.png",
      },
      {
        type: TempleAssetType.FA1_2,
        decimals: 6,
        symbol: "USDtz",
        name: "USDtez",
        fungible: true,
        status: "displayed",
        address: "KT1LN4LPSqTMS7Sd2CJw4bbDGRkMv2t68Fy9",
        iconUrl: "https://usdtz.com/lightlogo10USDtz.png",
      },
    ],
  ],
  [
    TempleChainId.Edo2net,
    [
      {
        type: TempleAssetType.FA1_2,
        decimals: 0,
        symbol: "KT1CUg3...wv3K",
        name: "KT1CUg3...wv3K",
        fungible: true,
        status: "displayed",
        address: "KT1CUg39jQF8mV6nTMqZxjUUZFuz1KXowv3K",
      },
      {
        type: TempleAssetType.FA1_2,
        decimals: 0,
        symbol: "KT1FCMQ...daWH",
        name: "KT1FCMQ...daWH",
        fungible: true,
        status: "displayed",
        address: "KT1FCMQk44tEP9fm9n5JJEhkSk1TW3XQdaWH",
      },
    ],
  ],
]);

function assetMatchesSearchStr(asset: TempleAsset, str: string) {
  return [
    asset.type === TempleAssetType.TEZ ? "" : asset.address,
    asset.name,
    asset.symbol,
  ].some((fieldValue) => fieldValue.toLowerCase().includes(str.toLowerCase()));
}

function getTokenKey(token: TempleToken) {
  return `${token.address}${
    token.type === TempleAssetType.FA2 ? `_${token.id}` : ""
  }`;
}

function getTokenId(token: TempleToken, replacer: number): number;
function getTokenId(
  token: TempleToken,
  replacer?: undefined
): number | undefined;
function getTokenId(token: TempleToken, replacer?: number) {
  return token.type === TempleAssetType.FA2 ? token.id : replacer;
}

async function getTokensToExchangeBigmaps(
  contractsAddresses: string[],
  tezos: TezosToolkit
): Promise<BigMapAbstraction[]> {
  return Promise.all(
    contractsAddresses.map(async (contractAddress) => {
      const tokenListContract = await loadContract(
        tezos,
        contractAddress,
        false
      );
      const tokenListStorage = await tokenListContract.storage<any>();
      return tokenListStorage.token_to_exchange;
    })
  );
}

export const getAssetExchangeData = (
  tokensExchangeData: TokensExchangeData,
  tezUsdPrice: number | null,
  asset: TempleAsset,
  exchanger: ExchangerType
): Partial<ExchangeDataEntry> | undefined => {
  if (asset.type === TempleAssetType.TEZ) {
    return {
      usdPrice: tezUsdPrice ?? undefined,
    };
  }
  return tokensExchangeData[asset.address]?.[getTokenId(asset, 0)]?.[exchanger];
};

export default function useSwappableAssets(
  searchString = "",
  tokenId?: number
) {
  const { allAssets: allVisibleAssets } = useAssets();
  const { hiddenTokens } = useTokens();
  const tezos = useTezos();
  const network = useNetwork();
  const tezUsdPrice = useAssetUSDPrice(TEZ_ASSET);
  const networkTezUsdPrice = network.type === "main" ? tezUsdPrice : null;
  const chainId = useChainId(true)!;
  const [qsStoredTokens, setQsStoredTokens] = useStorage<TempleToken[]>(
    `qs_1.1_stored_tokens_${chainId}`,
    []
  );
  const qsStoredTokensKeys = useMemo(
    () => qsStoredTokens.map(getTokenKey).join(),
    [qsStoredTokens]
  );

  const getQuipuswapTokensWhitelists = useCallback(
    async (_k: string, currentChainId: string) => {
      const quipuswapWhitelist = await getQuipuswapWhitelist();
      const result = new Map<string, TempleToken[]>();
      await Promise.all(
        quipuswapWhitelist.map(async (token) => {
          const { contractAddress, metadata: metadataFromApi, network } = token;
          const fallbackName = `${contractAddress.slice(
            0,
            7
          )}...${contractAddress.slice(-4)}`;
          const fallbackMetadata = {
            decimals: 0,
            symbol: fallbackName,
            name: fallbackName,
            iconUrl: undefined,
          };

          let metadata;
          if (metadataFromApi) {
            metadata = {
              ...metadataFromApi,
              iconUrl: metadataFromApi.thumbnailUri,
            };
          } else if (currentChainId === network) {
            metadata = await fetchTokenMetadata(
              tezos,
              contractAddress,
              token.type === "fa1.2" ? undefined : token.fa2TokenId
            ).catch(() => fallbackMetadata);
          } else {
            metadata = fallbackMetadata;
          }
          metadata.iconUrl = metadata.iconUrl && formatImgUri(metadata.iconUrl);
          if (metadata.name === "???") {
            metadata.name = fallbackName;
          }
          if (metadata.symbol === "???") {
            metadata.symbol = fallbackName;
          }

          const commonTokenMetadata = {
            address: contractAddress,
            decimals: metadata.decimals,
            symbol: metadata.symbol,
            name: metadata.name,
            iconUrl: metadata.iconUrl,
            fungible: true,
            status: "displayed" as const,
          };
          const tokenMetadata: TempleToken =
            token.type === "fa1.2"
              ? {
                  ...commonTokenMetadata,
                  type: TempleAssetType.FA1_2,
                }
              : {
                  ...commonTokenMetadata,
                  type: TempleAssetType.FA2,
                  id: token.fa2TokenId,
                };
          if (!result.get(network)) {
            result.set(network, []);
          }
          result.get(network)!.push(tokenMetadata);
        })
      );
      return result;
    },
    [tezos]
  );

  const { data: quipuswapTokenWhitelists } = useRetryableSWR(
    ["quipuswap-token-whitelists", chainId],
    getQuipuswapTokensWhitelists,
    { suspense: true }
  );

  const allKnownAssets = useMemo<TempleAsset[]>(() => {
    const allStoredAssets = [
      ...allVisibleAssets,
      ...hiddenTokens,
      ...qsStoredTokens,
    ];
    const newTokensFromWhitelist = (
      quipuswapTokenWhitelists!.get(chainId) ?? []
    ).filter((whitelistToken) => {
      return !allStoredAssets.some((storedToken) =>
        assetsAreSame(whitelistToken, storedToken)
      );
    });
    return [...allStoredAssets, ...newTokensFromWhitelist];
  }, [
    allVisibleAssets,
    hiddenTokens,
    chainId,
    quipuswapTokenWhitelists,
    qsStoredTokens,
  ]);

  const getAssetData = useCallback(
    async (assetId: AssetIdentifier): Promise<TempleAsset> => {
      const { address, tokenId } = assetId;
      if (!address) {
        return TEZ_ASSET;
      }
      let assetFromStorage = allKnownAssets.find((asset) =>
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
          iconUrl: tokenMetadata.iconUrl && formatImgUri(tokenMetadata.iconUrl),
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
    [allKnownAssets, tezos]
  );

  const getInitialQuipuswapExchangeContracts = useCallback(async () => {
    const result: Record<string, Record<number, string>> = {};
    const whitelist = quipuswapTokenWhitelists?.get(chainId) ?? [];
    const quipuswapContracts = QUIPUSWAP_CONTRACTS.get(chainId)!;
    const fa12FactoriesAddresses = quipuswapContracts.fa12Factory;
    const fa2FactoriesAddresses = quipuswapContracts.fa2Factory;
    const fa2TokensToExchangeBigmaps = fa2FactoriesAddresses
      ? await getTokensToExchangeBigmaps(fa2FactoriesAddresses, tezos)
      : [];
    const fa12TokensToExchangeBigmaps = fa12FactoriesAddresses
      ? await getTokensToExchangeBigmaps(fa12FactoriesAddresses, tezos)
      : [];
    const initialExchangableTokens = [
      ...whitelist,
      ...qsStoredTokens.filter(
        (token) =>
          !whitelist.some((whitelistedToken) =>
            assetsAreSame(token, whitelistedToken)
          )
      ),
    ];
    await Promise.all(
      initialExchangableTokens.map(async (token) => {
        const tokenId = getTokenId(token);
        let exchangeContractAddress: string | undefined;
        if (token.type === TempleAssetType.FA2) {
          exchangeContractAddress = (
            await Promise.all(
              fa2TokensToExchangeBigmaps.map((bigMap) =>
                bigMap.get<string | undefined>([token.address, token.id])
              )
            )
          ).find((value) => value !== undefined);
        } else {
          exchangeContractAddress = (
            await Promise.all(
              fa12TokensToExchangeBigmaps.map((bigMap) =>
                bigMap.get<string | undefined>(token.address)
              )
            )
          ).find((value) => value !== undefined);
        }
        if (!result[token.address]) {
          result[token.address] = {};
        }
        if (exchangeContractAddress) {
          result[token.address][tokenId ?? 0] = exchangeContractAddress;
        }
      })
    );
    return result;
  }, [tezos, chainId, quipuswapTokenWhitelists, qsStoredTokens]);

  const { data: initialQuipuswapExchangeContracts } = useRetryableSWR(
    [
      "initial-quipuswap-exchange-contracts",
      chainId,
      !!quipuswapTokenWhitelists,
      qsStoredTokensKeys,
    ],
    getInitialQuipuswapExchangeContracts,
    { suspense: true }
  );

  const [tokenIdRequiredFallback, setTokenIdRequiredFallback] = useState(false);

  const initialSwappableTokens = useMemo<SwappableTokensRawData>(() => {
    const quipuswapInitialTokens = quipuswapTokenWhitelists!.get(chainId) ?? [];
    const dexterInitialTokens = DEXTER_INITIAL_TOKENS.get(chainId) ?? [];
    return {
      quipuswap: quipuswapInitialTokens,
      dexter: dexterInitialTokens,
      quipuswapTokensExchangeContracts: initialQuipuswapExchangeContracts ?? {},
      networkIsSupported:
        quipuswapInitialTokens.length > 0 || dexterInitialTokens.length > 0,
      tokenIdRequired: tokenIdRequiredFallback,
    };
  }, [
    chainId,
    quipuswapTokenWhitelists,
    initialQuipuswapExchangeContracts,
    tokenIdRequiredFallback,
  ]);

  const getSwappableTokens = useCallback(
    async (
      _k: string,
      _networkId: string,
      searchStr: string,
      tokenId?: number
    ): Promise<SwappableTokensRawData> => {
      const tokenFilterPredicate = (token: TempleToken) =>
        assetMatchesSearchStr(token, searchStr) &&
        (tokenId === undefined ||
          token.type !== TempleAssetType.FA2 ||
          token.id === tokenId);

      const dexterTokensIdentifiers = Object.keys(
        DEXTER_EXCHANGE_CONTRACTS.get(chainId) ?? {}
      ).map((tokenAddress) => ({ address: tokenAddress }));
      const knownDexterTokens = DEXTER_INITIAL_TOKENS.get(chainId) ?? [];
      const dexterTokens = (
        await Promise.all(
          dexterTokensIdentifiers.map(async (id) => {
            const knownToken = knownDexterTokens.find((token) =>
              matchesAsset(id, token)
            );
            return knownToken ?? ((await getAssetData(id)) as TempleToken);
          })
        )
      ).filter(tokenFilterPredicate);

      const knownQuipuswapTokens = [
        ...(quipuswapTokenWhitelists!.get(chainId) ?? []),
        ...qsStoredTokens,
      ];
      const networkIsSupported =
        knownQuipuswapTokens.length > 0 || knownDexterTokens.length > 0;
      const matchingKnownQuipuswapTokens =
        knownQuipuswapTokens.filter(tokenFilterPredicate);
      const searchStrIsAddress =
        validateAddress(searchStr) === ValidationResult.VALID;
      const firstFoundToken = [
        ...dexterTokens,
        ...matchingKnownQuipuswapTokens,
      ][0];
      const foundTokenId = firstFoundToken && getTokenId(firstFoundToken);
      const minimalResult = {
        dexter: dexterTokens,
        quipuswap: matchingKnownQuipuswapTokens,
        quipuswapTokensExchangeContracts:
          initialQuipuswapExchangeContracts ?? {},
        networkIsSupported,
        tokenIdRequired: searchStrIsAddress
          ? foundTokenId !== undefined
          : false,
      };
      const someKnownTokensMatch = !!firstFoundToken;
      if (!searchStrIsAddress || !networkIsSupported || someKnownTokensMatch) {
        return minimalResult;
      }

      try {
        const contract = await loadContract(tezos, searchStr);
        let isFA2Token = false;
        let fa2IdIsCorrect = false;
        const quipuswapContracts = QUIPUSWAP_CONTRACTS.get(chainId)!;
        const fa2FactoriesAddresses = quipuswapContracts.fa2Factory;
        const fa12FactoriesAddresses = quipuswapContracts.fa12Factory;
        const fa2TokensToExchangeBigmaps = fa2FactoriesAddresses
          ? await getTokensToExchangeBigmaps(fa2FactoriesAddresses, tezos)
          : [];
        let exchangeContractAddress: string | undefined;
        try {
          await assertFA2TokenContract(contract);
          isFA2Token = true;
          if (tokenId !== undefined) {
            exchangeContractAddress = (
              await Promise.all(
                fa2TokensToExchangeBigmaps.map((bigMap) =>
                  bigMap.get<string | undefined>([searchStr, tokenId])
                )
              )
            ).find((value) => value !== undefined);
            fa2IdIsCorrect = !!exchangeContractAddress;
          }
        } catch (e) {}
        if (isFA2Token && !fa2IdIsCorrect) {
          return {
            ...minimalResult,
            tokenIdRequired: true,
          };
        }
        if (!isFA2Token) {
          try {
            const fa12TokensToExchangeBigmaps = fa12FactoriesAddresses
              ? await getTokensToExchangeBigmaps(fa12FactoriesAddresses, tezos)
              : [];
            if (fa12TokensToExchangeBigmaps.length > 0) {
              exchangeContractAddress = (
                await Promise.all(
                  fa12TokensToExchangeBigmaps.map((bigMap) =>
                    bigMap.get<string | undefined>(searchStr)
                  )
                )
              ).find((value) => value !== undefined);
            }
          } catch (e) {}
        }
        const tokenMetadata = await getAssetData({
          address: searchStr,
          tokenId,
        });

        if (exchangeContractAddress) {
          await setQsStoredTokens([
            ...qsStoredTokens,
            tokenMetadata as TempleToken,
          ]);
          if (!minimalResult.quipuswapTokensExchangeContracts[searchStr]) {
            minimalResult.quipuswapTokensExchangeContracts[searchStr] = {};
          }
          minimalResult.quipuswapTokensExchangeContracts[searchStr][
            tokenId ?? 0
          ] = exchangeContractAddress;
        }

        return {
          ...minimalResult,
          tokenIdRequired: isFA2Token,
          quipuswap: [tokenMetadata as TempleToken],
        };
      } catch (e) {
        console.error(e);
        return minimalResult;
      }
    },
    [
      tezos,
      getAssetData,
      chainId,
      quipuswapTokenWhitelists,
      initialQuipuswapExchangeContracts,
      qsStoredTokens,
      setQsStoredTokens,
    ]
  );

  const {
    data: swappableTokens = initialSwappableTokens,
    isValidating: swappableTokensLoading,
  } = useRetryableSWR(
    [
      "swappable-assets",
      network.id,
      searchString,
      tokenId,
      !!quipuswapTokenWhitelists,
      !!initialQuipuswapExchangeContracts,
      qsStoredTokensKeys,
    ],
    getSwappableTokens,
    { suspense: false }
  );

  useEffect(() => {
    setTokenIdRequiredFallback(swappableTokens.tokenIdRequired);
  }, [swappableTokens.tokenIdRequired]);

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
          exchangeContract: contractAddress,
        };
      }
      if (tokenPool.eq(0) || xtzPool.eq(0)) {
        return {
          usdPrice: undefined,
          maxExchangable: new BigNumber(0),
          exchangeContract: contractAddress,
        };
      }
      const midPrice =
        tokenPool.eq(0) || xtzPool.eq(0)
          ? new BigNumber(0)
          : xtzPool.dividedBy(tokenPool);
      return {
        usdPrice: midPrice
          .multipliedBy(tokenElementaryParts)
          .dividedBy(new BigNumber(10).pow(TEZ_ASSET.decimals))
          .multipliedBy(networkTezUsdPrice)
          .toNumber(),
        maxExchangable: tokenPool.idiv(3).div(tokenElementaryParts),
        exchangeContract: contractAddress,
      };
    },
    [tezos, networkTezUsdPrice]
  );

  const getExchangeData = useCallback(async () => {
    const result: TokensExchangeData = {};
    await Promise.all(
      swappableTokens.dexter.map(async (token) => {
        const newEntry = await getTokenExchangeData(
          token,
          DEXTER_EXCHANGE_CONTRACTS.get(chainId)![token.address][
            getTokenId(token, 0)
          ],
          "dexter"
        );
        const tokenId = getTokenId(token, 0);
        if (!result[token.address]) {
          result[token.address] = {};
        }
        result[token.address][tokenId] = {
          dexter: newEntry,
        };
      })
    );
    await Promise.all(
      swappableTokens.quipuswap.map(async (token) => {
        const contractAddress =
          swappableTokens.quipuswapTokensExchangeContracts[token.address][
            getTokenId(token, 0)
          ];
        const newEntry = await getTokenExchangeData(
          token,
          contractAddress,
          "quipuswap"
        );
        const tokenId = getTokenId(token, 0);
        if (!result[token.address]) {
          result[token.address] = {};
        }
        result[token.address][tokenId] = {
          ...(result[token.address][tokenId] || {}),
          quipuswap: newEntry,
        };
      })
    );
    return result;
  }, [swappableTokens, getTokenExchangeData, chainId]);

  const initialTokensExchangeData = useMemo(() => {
    const result: TokensExchangeData = {};
    swappableTokens.dexter.forEach((token) => {
      const newEntry = {
        usdPrice: undefined,
        maxExchangable: new BigNumber(Infinity),
        exchangeContract:
          DEXTER_EXCHANGE_CONTRACTS.get(chainId)![token.address][
            getTokenId(token, 0)
          ],
      };
      const tokenId = getTokenId(token, 0);
      if (!result[token.address]) {
        result[token.address] = {};
      }
      result[token.address][tokenId] = {
        dexter: newEntry,
      };
    });
    swappableTokens.quipuswap.forEach((token) => {
      const newEntry = {
        usdPrice: undefined,
        maxExchangable: new BigNumber(Infinity),
        exchangeContract:
          swappableTokens.quipuswapTokensExchangeContracts[token.address][
            getTokenId(token, 0)
          ],
      };
      const tokenId = getTokenId(token, 0);
      if (!result[token.address]) {
        result[token.address] = {};
      }
      result[token.address][tokenId] = {
        ...(result[token.address][tokenId] || {}),
        quipuswap: newEntry,
      };
    });
    return result;
  }, [chainId, swappableTokens]);

  const swappableTokensIds = useMemo(() => {
    if (!swappableTokens) {
      return "";
    }
    return [swappableTokens.quipuswap, swappableTokens.dexter]
      .map((tokens) => tokens.map(getTokenKey).join())
      .join(";");
  }, [swappableTokens]);
  const {
    data: tokensExchangeData = initialTokensExchangeData,
    revalidate: updateTokensExchangeData,
    isValidating: exchangeDataLoading,
  } = useRetryableSWR(
    [
      "swappable-assets-exchange-data",
      network.id,
      swappableTokensIds,
      networkTezUsdPrice,
    ],
    getExchangeData,
    { suspense: false }
  );

  const swappableAssets = useMemo<TempleAsset[]>(() => {
    const dexterSwappableTokens = swappableTokens?.dexter ?? [];
    const result = assetMatchesSearchStr(TEZ_ASSET, searchString)
      ? [TEZ_ASSET, ...dexterSwappableTokens]
      : [...dexterSwappableTokens];
    swappableTokens?.quipuswap.forEach((token) => {
      if (
        !dexterSwappableTokens.some((dexterToken) =>
          assetsAreSame(token, dexterToken)
        )
      ) {
        result.push(token);
      }
    });
    return result;
  }, [searchString, swappableTokens]);

  return {
    assets: swappableAssets,
    updateTokensExchangeData,
    isSupportedNetwork: swappableTokens?.networkIsSupported ?? true,
    tokenIdRequired: swappableTokens?.tokenIdRequired ?? false,
    quipuswapTokensWhitelist: quipuswapTokenWhitelists!.get(chainId) ?? [],
    isLoading: exchangeDataLoading || swappableTokensLoading,
    tezUsdPrice: networkTezUsdPrice,
    tokensExchangeData,
  };
}
