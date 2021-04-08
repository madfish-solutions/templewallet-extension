import { useCallback, useEffect, useMemo, useState } from "react";

import { BigMapAbstraction, TezosToolkit } from "@taquito/taquito";
import { validateAddress, ValidationResult } from "@taquito/utils";
import BigNumber from "bignumber.js";

import { sanitizeImgUri } from "lib/image-uri";
import { getQuipuswapWhitelist } from "lib/quipuswap";
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
  ExchangeDataEntry,
  assertFA2TokenContract,
  useStorage,
} from "lib/temple/front";
import {
  TempleAsset,
  TempleAssetType,
  TempleChainId,
  TempleToken,
} from "lib/temple/types";

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
  return `${token.address}${token.type === TempleAssetType.FA2 ? `_${token.id}` : ""}`;
}

async function getTokensToExchange(
  contractAddress: string,
  tezos: TezosToolkit
): Promise<BigMapAbstraction> {
  const tokenListContract = await loadContract(tezos, contractAddress, false);
  const tokenListStorage = await tokenListContract.storage<any>();
  return tokenListStorage.token_to_exchange;
}

export default function useSwappableAssets(
  searchString = "",
  tokenId?: number
) {
  const { allAssets: allVisibleAssets } = useAssets();
  const { hiddenTokens } = useTokens();
  const tezos = useTezos();
  const network = useNetwork();
  const tezUsdPrice = useUSDPrice();
  const networkTezUsdPrice = network.type === "main" ? tezUsdPrice : null;
  const chainId = useChainId(true)!;
  const [qsStoredTokens, setQsStoredTokens] = useStorage<TempleToken[]>(
    `qs_stored_tokens_${chainId}`,
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
              iconUrl: metadataFromApi.thumbnailUrl,
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
          metadata.iconUrl = metadata.iconUrl && sanitizeImgUri(metadata.iconUrl);

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
    const allStoredAssets = [...allVisibleAssets, ...hiddenTokens, ...qsStoredTokens];
    const newTokensFromWhitelist = (quipuswapTokenWhitelists!.get(chainId) ?? []).filter(
      (whitelistToken) => {
        return !allStoredAssets.some((storedToken) =>
          assetsAreSame(whitelistToken, storedToken)
        );
      }
    );
    return [
      ...allStoredAssets,
      ...newTokensFromWhitelist,
    ];
  }, [allVisibleAssets, hiddenTokens, chainId, quipuswapTokenWhitelists, qsStoredTokens]);

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
          iconUrl: tokenMetadata.iconUrl && sanitizeImgUri(tokenMetadata.iconUrl),
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
    const fa2TokensToExchange = await getTokensToExchange(
      quipuswapContracts.fa2Factory,
      tezos
    );
    const fa12TokensToExchange = await getTokensToExchange(
      quipuswapContracts.fa12Factory,
      tezos
    );
    const initialExchangableTokens = [
      ...whitelist,
      ...qsStoredTokens.filter(
        token => !whitelist.some(whitelistedToken => assetsAreSame(token, whitelistedToken))
      )
    ];
    await Promise.all(
      initialExchangableTokens.map(async (token) => {
        const tokenId =
          token.type === TempleAssetType.FA2 ? token.id : undefined;
        let exchangeContractAddress: string;
        if (token.type === TempleAssetType.FA2) {
          // @ts-ignore
          exchangeContractAddress = (await fa2TokensToExchange.get([
            token.address,
            token.id,
          ]))!;
        } else {
          exchangeContractAddress = (await fa12TokensToExchange.get(
            token.address
          ))! as string;
        }
        if (!result[token.address]) {
          result[token.address] = {};
        }
        result[token.address][tokenId ?? 0] = exchangeContractAddress;
      })
    );
    return result;
  }, [tezos, chainId, quipuswapTokenWhitelists, qsStoredTokens]);

  const { data: initialQuipuswapExchangeContracts } = useRetryableSWR(
    ["initial-quipuswap-exchange-contracts", chainId, !!quipuswapTokenWhitelists, qsStoredTokensKeys],
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
          (tokenId === undefined || token.type !== TempleAssetType.FA2 || token.id === tokenId)

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
        ...quipuswapTokenWhitelists!.get(chainId) ?? [],
        ...qsStoredTokens
      ];
      const networkIsSupported =
        knownQuipuswapTokens.length > 0 || knownDexterTokens.length > 0;
      const matchingKnownQuipuswapTokens = knownQuipuswapTokens.filter(tokenFilterPredicate);
      const searchStrIsAddress = validateAddress(searchStr) === ValidationResult.VALID;
      const firstFoundToken = [...dexterTokens, ...matchingKnownQuipuswapTokens][0];
      const foundTokenId = firstFoundToken?.type === TempleAssetType.FA2
        ? firstFoundToken.id
        : undefined;
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
        const fa2TokensList = await getTokensToExchange(
          quipuswapContracts.fa2Factory,
          tezos
        );
        let exchangeContractAddress: string | undefined;
        try {
          await assertFA2TokenContract(contract);
          isFA2Token = true;
          if (tokenId !== undefined) {
            // @ts-ignore
            exchangeContractAddress = await fa2TokensList.get([
              searchStr,
              tokenId,
            ]);
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
            const tokensList = await getTokensToExchange(
              quipuswapContracts.fa12Factory,
              tezos
            );
            exchangeContractAddress = await tokensList.get(searchStr);
          } catch (e) {}
        }
        const tokenMetadata = await getAssetData({
          address: searchStr,
          tokenId,
        });

        if (exchangeContractAddress) {
          await setQsStoredTokens([
            ...qsStoredTokens,
            tokenMetadata as TempleToken
          ]);
          if (!minimalResult.quipuswapTokensExchangeContracts[searchStr]) {
            minimalResult.quipuswapTokensExchangeContracts[searchStr] = {};
          }
          minimalResult.quipuswapTokensExchangeContracts[searchStr][tokenId ?? 0] = exchangeContractAddress;
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
      setQsStoredTokens
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
      qsStoredTokensKeys
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

  const getExchangeData = useCallback<
    () => Promise<Record<ExchangerType, ExchangeDataEntry[]>>
  >(
    async () => ({
      dexter: await Promise.all(
        swappableTokens.dexter.map((token) =>
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
        swappableTokens.quipuswap.map((token) => {
          const contractAddress =
            swappableTokens.quipuswapTokensExchangeContracts[token.address][
              token.type === TempleAssetType.FA2 ? token.id : 0
            ];
          return getTokenExchangeData(token, contractAddress, "quipuswap");
        })
      ),
    }),
    [swappableTokens, getTokenExchangeData, chainId]
  );

  const initialTokensExchangeData = useMemo<
    Record<ExchangerType, ExchangeDataEntry[]>
  >(
    () => ({
      dexter: swappableTokens.dexter.map((token) => ({
        usdPrice: undefined,
        maxExchangable: new BigNumber(Infinity),
        exchangeContract: DEXTER_EXCHANGE_CONTRACTS.get(chainId)![
          token.address
        ][token.type === TempleAssetType.FA2 ? token.id : 0],
      })),
      quipuswap: swappableTokens.quipuswap.map((token) => ({
        usdPrice: undefined,
        maxExchangable: new BigNumber(Infinity),
        exchangeContract:
          swappableTokens.quipuswapTokensExchangeContracts[token.address][
            token.type === TempleAssetType.FA2 ? token.id : 0
          ],
      })),
    }),
    [chainId, swappableTokens]
  );

  const swappableTokensIds = useMemo(() => {
    if (!swappableTokens) {
      return "";
    }
    return [
      swappableTokens.quipuswap,
      swappableTokens.dexter
    ].map(tokens => tokens.map(getTokenKey).join()).join(';');
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

  const swappableAssetsWithPrices = useMemo<
    TempleAssetWithExchangeData[]
  >(() => {
    const maybeTezAssetFragment = assetMatchesSearchStr(TEZ_ASSET, searchString)
      ? [
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
        ]
      : [];

    return [
      ...maybeTezAssetFragment,
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
    ];
  }, [swappableTokens, tokensExchangeData, networkTezUsdPrice, searchString]);

  return {
    assets: swappableAssetsWithPrices,
    updateTokensExchangeData,
    isSupportedNetwork: swappableTokens?.networkIsSupported ?? true,
    tokenIdRequired: swappableTokens?.tokenIdRequired ?? false,
    quipuswapTokensWhitelist: quipuswapTokenWhitelists!.get(chainId) ?? [],
    isLoading: exchangeDataLoading || swappableTokensLoading,
  };
}
