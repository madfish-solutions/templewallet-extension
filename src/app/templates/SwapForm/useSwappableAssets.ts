import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { BigMapAbstraction, TezosToolkit } from "@taquito/taquito";
import { validateAddress, ValidationResult } from "@taquito/utils";
import BigNumber from "bignumber.js";
import constate from "constate";

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
  assertFA2TokenContract,
  useStorage,
  useAssetUSDPrice,
  getAssetId,
  fetchContract,
  mutezToTz,
  getAssetKey,
} from "lib/temple/front";
import {
  TempleAsset,
  TempleAssetType,
  TempleChainId,
  TempleToken,
} from "lib/temple/types";

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

export type TokenExchangeData = Record<
  ExchangerType,
  {
    contract: string;
    normalizedTezLiquidity: BigNumber;
    normalizedTokenLiquidity: BigNumber;
    usdPrice?: number;
  }
>;
export type TokensExchangeData = Record<
  string,
  Record<number, Partial<TokenExchangeData>>
>;

export const getAssetExchangeData = (
  tokensExchangeData: TokensExchangeData,
  tezUsdPrice: number | null,
  asset: TempleAsset,
  exchanger: ExchangerType
) => {
  if (asset.type === TempleAssetType.TEZ) {
    return {
      contract: undefined,
      normalizedTezLiquidity: undefined,
      normalizedTokenLiquidity: undefined,
      usdPrice: tezUsdPrice ?? undefined,
    };
  }
  return tokensExchangeData[asset.address]?.[getTokenId(asset, 0)]?.[exchanger];
};

type SwappableAssetsProviderProps = {
  initialAssetKey?: string;
};

export const [SwappableAssetsProvider, useSwappableAssets] = constate(
  ({ initialAssetKey }: SwappableAssetsProviderProps) => {
    const { allAssets: allVisibleAssets } = useAssets();
    const { hiddenTokens } = useTokens();
    const tezos = useTezos();
    const network = useNetwork();
    const tezUsdPrice = useAssetUSDPrice(TEZ_ASSET);
    const networkTezUsdPrice = network.type === "main" ? tezUsdPrice : null;
    const chainId = useChainId(true)!;
    const prevChainIdRef = useRef(chainId);
    const [qsStoredTokens, setQsStoredTokens] = useStorage<TempleToken[]>(
      `qs_1.1_stored_tokens_${chainId}`,
      []
    );

    const getAssetData = useCallback(
      async (
        knownAssets: TempleAsset[],
        assetId: AssetIdentifier
      ): Promise<TempleAsset> => {
        const { address, tokenId } = assetId;
        if (!address) {
          return TEZ_ASSET;
        }
        const alreadyKnownAsset = knownAssets.find((asset) =>
          matchesAsset(assetId, asset)
        );
        if (alreadyKnownAsset) {
          return alreadyKnownAsset;
        }
        const shortHash = `${address.slice(0, 7)}...${address.slice(-4)}`;
        try {
          const tokenMetadata = await fetchTokenMetadata(
            tezos,
            address,
            tokenId
          );
          const { name: parsedName, symbol: parsedSymbol } = tokenMetadata;
          const commonMetadata = {
            ...tokenMetadata,
            iconUrl:
              tokenMetadata.iconUrl && formatImgUri(tokenMetadata.iconUrl),
            name: !parsedName || parsedName === "???" ? shortHash : parsedName,
            symbol:
              !parsedSymbol || parsedSymbol === "???"
                ? shortHash
                : parsedSymbol,
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
      [tezos]
    );

    const getNewExchangeData = useCallback(
      async (knownAssets: TempleAsset[], assetId: AssetIdentifier) => {
        const { address: tokenAddress, tokenId } = assetId;

        if (!tokenAddress) {
          return {};
        }

        const asset = await getAssetData(knownAssets, assetId);
        const dexterExchangeContract =
          DEXTER_EXCHANGE_CONTRACTS.get(chainId)?.[tokenAddress]?.[
            tokenId ?? 0
          ];
        const newExchangers: Partial<TokenExchangeData> = {};
        if (dexterExchangeContract) {
          const { tokenPool, xtzPool } = await getPoolParameters(
            tezos,
            dexterExchangeContract,
            "dexter"
          );
          const normalizedTezLiquidity = mutezToTz(xtzPool);
          const normalizedTokenLiquidity = tokenPool.div(
            new BigNumber(10).pow(asset.decimals)
          );
          newExchangers.dexter = {
            contract: dexterExchangeContract,
            normalizedTezLiquidity,
            normalizedTokenLiquidity,
            usdPrice: normalizedTokenLiquidity.eq(0)
              ? undefined
              : (networkTezUsdPrice &&
                  normalizedTezLiquidity
                    .div(normalizedTokenLiquidity)
                    .times(networkTezUsdPrice)
                    .toNumber()) ??
                undefined,
          };
        }

        const quipuswapFactories = QUIPUSWAP_CONTRACTS.get(chainId);
        if (quipuswapFactories) {
          let exchangeContract: string | undefined;
          if (tokenId === undefined) {
            const fa12FactoriesAddresses = quipuswapFactories.fa12Factory;
            const fa12TokensToExchangeBigmaps = fa12FactoriesAddresses
              ? await getTokensToExchangeBigmaps(fa12FactoriesAddresses, tezos)
              : [];
            exchangeContract = (
              await Promise.all(
                fa12TokensToExchangeBigmaps.map((bigMap) =>
                  bigMap.get<string | undefined>(tokenAddress)
                )
              )
            ).find((value) => value !== undefined);
          } else {
            const fa2FactoriesAddresses = quipuswapFactories.fa2Factory;
            const fa2TokensToExchangeBigmaps = fa2FactoriesAddresses
              ? await getTokensToExchangeBigmaps(fa2FactoriesAddresses, tezos)
              : [];
            exchangeContract = (
              await Promise.all(
                fa2TokensToExchangeBigmaps.map((bigMap) =>
                  bigMap.get<string | undefined>([tokenAddress, tokenId])
                )
              )
            ).find((value) => value !== undefined);
          }
          if (exchangeContract) {
            const { tokenPool, xtzPool } = await getPoolParameters(
              tezos,
              exchangeContract,
              "quipuswap"
            );
            const normalizedTezLiquidity = mutezToTz(xtzPool);
            const normalizedTokenLiquidity = tokenPool.div(
              new BigNumber(10).pow(asset.decimals)
            );
            newExchangers.quipuswap = {
              contract: exchangeContract,
              normalizedTezLiquidity,
              normalizedTokenLiquidity,
              usdPrice: normalizedTokenLiquidity.eq(0)
                ? undefined
                : (networkTezUsdPrice &&
                    normalizedTezLiquidity
                      .div(normalizedTokenLiquidity)
                      .times(networkTezUsdPrice)
                      .toNumber()) ??
                  undefined,
            };
          }
        }
        return newExchangers;
      },
      [chainId, getAssetData, networkTezUsdPrice, tezos]
    );

    const getQuipuswapTokensWhitelists = useCallback(
      async (_k: string, currentChainId: string) => {
        const quipuswapWhitelist = await getQuipuswapWhitelist();
        const result = new Map<string, TempleToken[]>();
        await Promise.all(
          quipuswapWhitelist.map(async (token) => {
            const {
              contractAddress,
              metadata: metadataFromApi,
              network,
            } = token;
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
            metadata.iconUrl =
              metadata.iconUrl && formatImgUri(metadata.iconUrl);
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

    const noInitialAssetKeyExchangableAssets = useMemo(() => {
      return Object.values(
        [
          TEZ_ASSET,
          ...qsStoredTokens,
          ...(quipuswapTokenWhitelists!.get(chainId) ?? []),
          ...(DEXTER_INITIAL_TOKENS.get(chainId) ?? []),
        ].reduce<Record<string, TempleAsset>>((previousValue, asset) => {
          const { address, tokenId } = getAssetId(asset);
          return {
            ...previousValue,
            [`${address}_${tokenId}`]: asset,
          };
        }, {})
      );
    }, [chainId, qsStoredTokens, quipuswapTokenWhitelists]);

    const noInitialAssetKeyKnownAssets = useMemo(() => {
      return Object.values(
        [
          ...allVisibleAssets,
          ...hiddenTokens,
          ...noInitialAssetKeyExchangableAssets,
        ].reduce<Record<string, TempleAsset>>((previousValue, asset) => {
          const { address, tokenId } = getAssetId(asset);
          return {
            ...previousValue,
            [`${address}_${tokenId}`]: asset,
          };
        }, {})
      );
    }, [allVisibleAssets, hiddenTokens, noInitialAssetKeyExchangableAssets]);
    const noInitialAssetKeyAssetsKey = useMemo(() => {
      return noInitialAssetKeyKnownAssets
        .map((asset) => {
          const { address, tokenId } = getAssetId(asset);
          return `${address}_${tokenId}`;
        })
        .join();
    }, [noInitialAssetKeyKnownAssets]);

    const getAssetFromInitialKey = useCallback(async () => {
      if (!initialAssetKey) {
        return null;
      }
      if (initialAssetKey === "tez") {
        return TEZ_ASSET;
      }
      const [assetAddress, rawAssetId] = initialAssetKey.split("_");
      const alreadyKnownAsset = noInitialAssetKeyKnownAssets.find(
        (candidate) => {
          switch (candidate.type) {
            case TempleAssetType.TEZ:
              return false;
            case TempleAssetType.FA2:
              return (
                candidate.address === assetAddress &&
                Number(rawAssetId ?? "0") === candidate.id
              );
            default:
              return candidate.address === assetAddress;
          }
        }
      );
      if (alreadyKnownAsset) {
        return alreadyKnownAsset;
      }
      try {
        const contract = await fetchContract(tezos, assetAddress);
        try {
          await assertFA2TokenContract(contract);
          return getAssetData([], {
            address: assetAddress,
            tokenId: Number(rawAssetId),
          });
        } catch (e) {
          return getAssetData([], { address: assetAddress });
        }
      } catch (e) {
        return null;
      }
    }, [initialAssetKey, noInitialAssetKeyKnownAssets, getAssetData, tezos]);

    const { data: assetFromInitialKey } = useRetryableSWR(
      ["asset-from-key", initialAssetKey, chainId, noInitialAssetKeyAssetsKey],
      getAssetFromInitialKey,
      { suspense: true }
    );

    const getAssetFromInitialKeyExchangeData = useCallback(async () => {
      if (!initialAssetKey || initialAssetKey === "tez") {
        return null;
      }

      const [assetAddress, rawAssetId] = initialAssetKey.split("_");
      let tokenId: number | undefined;
      try {
        await assertFA2TokenContract(await fetchContract(tezos, assetAddress));
        tokenId = Number(rawAssetId);
      } catch {}

      return getNewExchangeData(
        assetFromInitialKey ? [assetFromInitialKey] : [],
        {
          address: assetAddress,
          tokenId,
        }
      );
    }, [assetFromInitialKey, getNewExchangeData, initialAssetKey, tezos]);

    const { data: assetFromInitialKeyExchangeData } = useRetryableSWR(
      [
        "asset-from-key-exchange-data",
        assetFromInitialKey && getAssetKey(assetFromInitialKey),
      ],
      getAssetFromInitialKeyExchangeData,
      { suspense: true }
    );

    const initialExchangeData = useMemo(() => {
      if (
        !assetFromInitialKey ||
        assetFromInitialKey.type === TempleAssetType.TEZ ||
        !assetFromInitialKeyExchangeData
      ) {
        return {};
      }
      return {
        [assetFromInitialKey.address]: {
          [getTokenId(assetFromInitialKey, 0)]: assetFromInitialKeyExchangeData,
        },
      };
    }, [assetFromInitialKey, assetFromInitialKeyExchangeData]);

    const noSearchStrKnownAssets = useMemo(
      () =>
        assetFromInitialKey &&
        !noInitialAssetKeyKnownAssets.some((asset) =>
          assetsAreSame(asset, assetFromInitialKey)
        )
          ? [assetFromInitialKey, ...noInitialAssetKeyKnownAssets]
          : noInitialAssetKeyKnownAssets,
      [noInitialAssetKeyKnownAssets, assetFromInitialKey]
    );
    const noSearchStrExchangableAssets = useMemo(
      () =>
        assetFromInitialKey &&
        !noInitialAssetKeyExchangableAssets.some((asset) =>
          assetsAreSame(asset, assetFromInitialKey)
        ) &&
        assetFromInitialKeyExchangeData &&
        Object.keys(assetFromInitialKeyExchangeData).length > 0
          ? [assetFromInitialKey, ...noInitialAssetKeyExchangableAssets]
          : noInitialAssetKeyExchangableAssets,
      [
        assetFromInitialKey,
        assetFromInitialKeyExchangeData,
        noInitialAssetKeyExchangableAssets,
      ]
    );

    const [exchangableAssets, setExchangableAssets] = useState(
      noSearchStrExchangableAssets
    );
    const [knownAssets, setKnownAssets] = useState(noSearchStrKnownAssets);
    const [exchangeData, setExchangeData] =
      useState<TokensExchangeData>(initialExchangeData);
    const [exchangeDataLoading, setExchangeDataLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);

    useEffect(() => {
      if (prevChainIdRef.current !== chainId) {
        setExchangableAssets(noSearchStrExchangableAssets);
        setKnownAssets(noSearchStrKnownAssets);
        setExchangeData(initialExchangeData);
      }
      prevChainIdRef.current = chainId;
    }, [
      chainId,
      initialExchangeData,
      noSearchStrKnownAssets,
      noSearchStrExchangableAssets,
    ]);

    const ensureExchangeData = useCallback(
      async (assetId: AssetIdentifier) => {
        const { address: tokenAddress, tokenId } = assetId;

        if (!tokenAddress) {
          return {};
        }

        const alreadyKnownExchangers =
          exchangeData[tokenAddress]?.[tokenId ?? 0];
        if (alreadyKnownExchangers) {
          return alreadyKnownExchangers;
        }

        setExchangeDataLoading(true);
        const newExchangers = await getNewExchangeData(knownAssets, assetId);
        const newExchangeData = {
          ...exchangeData,
        };
        if (!newExchangeData[tokenAddress]) {
          newExchangeData[tokenAddress] = {};
        }
        newExchangeData[tokenAddress][tokenId ?? 0] = newExchangers;
        setExchangeData(newExchangeData);
        setExchangeDataLoading(false);
        return newExchangers;
      },
      [exchangeData, getNewExchangeData, knownAssets]
    );

    const searchAssets = useCallback(
      async (searchString = "", tokenId?: number) => {
        const matchingExchangableAssets = exchangableAssets.filter((asset) => {
          return (
            assetMatchesSearchStr(asset, searchString) &&
            (asset.type !== TempleAssetType.FA2 ||
              tokenId === undefined ||
              tokenId === asset.id)
          );
        });
        if (validateAddress(searchString) !== ValidationResult.VALID) {
          return {
            matchingExchangableAssets,
            showTokenIdInput: false,
          };
        }
        if (matchingExchangableAssets.length > 0) {
          return {
            matchingExchangableAssets,
            showTokenIdInput:
              matchingExchangableAssets[0].type === TempleAssetType.FA2,
          };
        }
        try {
          setSearchLoading(true);
          const quipuswapFactories = QUIPUSWAP_CONTRACTS.get(chainId);
          if (!quipuswapFactories) {
            setSearchLoading(false);
            return {
              matchingExchangableAssets: [],
              showTokenIdInput: false,
            };
          }

          const contract = await loadContract(tezos, searchString);
          let exchangeContractAddress: string | undefined;
          let showTokenIdInput = false;
          try {
            await assertFA2TokenContract(contract);
            showTokenIdInput = true;
            if (tokenId === undefined) {
              setSearchLoading(false);
              return {
                matchingExchangableAssets: [],
                showTokenIdInput: true,
              };
            }
            const fa2FactoriesAddresses = quipuswapFactories.fa2Factory;
            const fa2TokensToExchangeBigmaps = fa2FactoriesAddresses
              ? await getTokensToExchangeBigmaps(fa2FactoriesAddresses, tezos)
              : [];
            exchangeContractAddress = (
              await Promise.all(
                fa2TokensToExchangeBigmaps.map((bigMap) =>
                  bigMap.get<string | undefined>([searchString, tokenId])
                )
              )
            ).find((value) => value !== undefined);
          } catch (e) {
            const fa12FactoriesAddresses = quipuswapFactories.fa12Factory;
            const fa12TokensToExchangeBigmaps = fa12FactoriesAddresses
              ? await getTokensToExchangeBigmaps(fa12FactoriesAddresses, tezos)
              : [];
            exchangeContractAddress = (
              await Promise.all(
                fa12TokensToExchangeBigmaps.map((bigMap) =>
                  bigMap.get<string | undefined>(searchString)
                )
              )
            ).find((value) => value !== undefined);
          }
          if (exchangeContractAddress) {
            const tokenMetadata = await getAssetData(knownAssets, {
              tokenId,
              address: searchString,
            });
            const { xtzPool, tokenPool } = await getPoolParameters(
              tezos,
              exchangeContractAddress,
              "quipuswap"
            );
            const normalizedTezLiquidity = mutezToTz(xtzPool);
            const normalizedTokenLiquidity = tokenPool.div(
              new BigNumber(10).pow(tokenMetadata.decimals)
            );
            setKnownAssets([...knownAssets, tokenMetadata]);
            setExchangableAssets([...exchangableAssets, tokenMetadata]);
            setQsStoredTokens([
              ...qsStoredTokens,
              tokenMetadata as TempleToken,
            ]);
            const newExchangeData = {
              ...exchangeData,
            };
            if (!newExchangeData[searchString]) {
              newExchangeData[searchString] = {};
            }
            newExchangeData[searchString][tokenId ?? 0] = {
              ...newExchangeData[searchString][tokenId ?? 0],
              quipuswap: {
                contract: exchangeContractAddress,
                normalizedTezLiquidity,
                normalizedTokenLiquidity,
                usdPrice: normalizedTokenLiquidity.eq(0)
                  ? undefined
                  : (networkTezUsdPrice &&
                      normalizedTezLiquidity
                        .div(normalizedTokenLiquidity)
                        .times(networkTezUsdPrice)
                        .toNumber()) ??
                    undefined,
              },
            };
            setExchangeData(newExchangeData);
            setSearchLoading(false);
            return {
              matchingExchangableAssets: [tokenMetadata],
              showTokenIdInput,
            };
          }
          setSearchLoading(false);
          return {
            matchingExchangableAssets: [],
            showTokenIdInput: false,
          };
        } catch (e) {
          setSearchLoading(false);
          return {
            matchingExchangableAssets: [],
            showTokenIdInput: false,
          };
        }
      },
      [
        chainId,
        exchangeData,
        getAssetData,
        exchangableAssets,
        knownAssets,
        networkTezUsdPrice,
        tezos,
        qsStoredTokens,
        setQsStoredTokens,
      ]
    );

    return {
      tezUsdPrice: networkTezUsdPrice,
      exchangableAssets,
      exchangeData,
      exchangeDataLoading,
      searchLoading,
      ensureExchangeData,
      quipuswapTokensWhitelist: quipuswapTokenWhitelists?.get(chainId) ?? [],
      searchAssets,
    };
  }
);
