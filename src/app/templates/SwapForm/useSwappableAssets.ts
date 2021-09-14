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
  useNetwork,
  useTezos,
  useChainId,
  assetsAreSame,
  useAllKnownFungibleTokenSlugs,
  useStorage,
  useAssetUSDPrice,
  getAssetId,
  mutezToTz,
  getAssetKey,
  LIQUIDITY_BAKING_CONTRACTS,
  useAssetsMetadata,
  toLegacyAsset,
  toTokenSlug,
  TempleToken,
  TempleChainId,
  TempleAssetType,
  TempleAsset,
  detectTokenStandard,
} from "lib/temple/front";
import useSafeState from "lib/ui/useSafeState";

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
        address: "KT1K9gCRgaLRFKTErYt1wVxA3Frb9FjasjTV",
        iconUrl: "https://kolibri-data.s3.amazonaws.com/logo.png",
      },
      {
        type: TempleAssetType.FA1_2,
        decimals: 6,
        symbol: "wXTZ",
        name: "Wrapped Tezos",
        fungible: true,
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
        address: "KT19at7rQUvyjxnZ2fBv7D9zc8rkyG7gAoU8",
        iconUrl: "https://ethtz.io/ETHtz_purple.png",
      },
      {
        type: TempleAssetType.FA1_2,
        decimals: 6,
        symbol: "USDtz",
        name: "USDtez",
        fungible: true,
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
        address: "KT1CUg39jQF8mV6nTMqZxjUUZFuz1KXowv3K",
      },
      {
        type: TempleAssetType.FA1_2,
        decimals: 0,
        symbol: "KT1FCMQ...daWH",
        name: "KT1FCMQ...daWH",
        fungible: true,
        address: "KT1FCMQk44tEP9fm9n5JJEhkSk1TW3XQdaWH",
      },
    ],
  ],
]);

const LIQUIDITY_BAKING_INITIAL_TOKENS = new Map<string, TempleToken[]>([
  [
    TempleChainId.Granadanet,
    [
      {
        type: TempleAssetType.FA1_2,
        decimals: 0,
        symbol: "KT1Vqar...mkCN",
        name: "KT1Vqar...mkCN",
        fungible: true,
        address: "KT1VqarPDicMFn1ejmQqqshUkUXTCTXwmkCN",
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
    const chainId = useChainId(true)!;
    const tezos = useTezos();
    const network = useNetwork();

    const { data: allKnownTokenSlugs = [] } =
      useAllKnownFungibleTokenSlugs(chainId);
    const { allTokensBaseMetadataRef } = useAssetsMetadata();

    const [allKnownAssets, setAllKnownAssets] = useSafeState<TempleAsset[]>(
      [],
      chainId
    );

    useEffect(() => {
      (async () => {
        try {
          const result: TempleAsset[] = [TEZ_ASSET];
          for (const slug of allKnownTokenSlugs) {
            const metadata = allTokensBaseMetadataRef.current[slug];
            if (metadata) {
              result.push(await toLegacyAsset(tezos, slug, metadata));
            }
          }

          setAllKnownAssets(result);
        } catch {}
      })();
    }, [
      setAllKnownAssets,
      allKnownTokenSlugs,
      allTokensBaseMetadataRef,
      tezos,
    ]);

    const tezUsdPrice = useAssetUSDPrice("tez");
    const networkTezUsdPrice = network.type === "main" ? tezUsdPrice : null;
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
          const tokenSlug = toTokenSlug(address, tokenId);
          const tokenMetadata =
            allTokensBaseMetadataRef.current[tokenSlug] ??
            (await fetchTokenMetadata(tezos, tokenSlug).then(
              ({ base }) => base
            ));
          const { name: parsedName, symbol: parsedSymbol } = tokenMetadata;
          const commonMetadata = {
            ...tokenMetadata,
            iconUrl:
              tokenMetadata.thumbnailUri &&
              formatImgUri(tokenMetadata.thumbnailUri),
            name: !parsedName || parsedName === "???" ? shortHash : parsedName,
            symbol:
              !parsedSymbol || parsedSymbol === "???"
                ? shortHash
                : parsedSymbol,
            address,
            fungible: true,
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
      [tezos, allTokensBaseMetadataRef]
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
        const liquidityBakingContract =
          LIQUIDITY_BAKING_CONTRACTS.get(chainId)?.[tokenAddress]?.[
            tokenId ?? 0
          ];
        const newExchangers: Partial<TokenExchangeData> = {};
        await Promise.all(
          [
            { contract: dexterExchangeContract, type: "dexter" as const },
            {
              contract: liquidityBakingContract,
              type: "liquidity_baking" as const,
            },
          ].map(async ({ contract, type }) => {
            if (contract) {
              const { tokenPool, xtzPool } = await getPoolParameters(
                tezos,
                contract,
                type
              );
              const normalizedTezLiquidity = mutezToTz(xtzPool);
              const normalizedTokenLiquidity = tokenPool.div(
                new BigNumber(10).pow(asset.decimals)
              );
              newExchangers[type] = {
                contract,
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
          })
        );

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
              thumbnailUri: undefined,
            };

            let metadata;
            if (metadataFromApi) {
              metadata = {
                ...metadataFromApi,
                iconUrl: metadataFromApi.thumbnailUri,
              };
            } else if (currentChainId === network) {
              const tokenSlug = toTokenSlug(
                contractAddress,
                token.type === "fa1.2" ? undefined : token.fa2TokenId
              );

              metadata =
                allTokensBaseMetadataRef.current[tokenSlug] ??
                (await fetchTokenMetadata(tezos, tokenSlug)
                  .then(({ base }) => base)
                  .catch(() => ({ base: fallbackMetadata })));
            } else {
              metadata = fallbackMetadata;
            }
            metadata.thumbnailUri =
              metadata.thumbnailUri && formatImgUri(metadata.thumbnailUri);
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
              iconUrl: metadata.thumbnailUri,
              fungible: true,
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
      [tezos, allTokensBaseMetadataRef]
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
          ...(LIQUIDITY_BAKING_INITIAL_TOKENS.get(chainId) ?? []),
        ].reduce<Record<string, TempleAsset>>((previousValue, asset) => {
          const { address, tokenId } = getAssetId(asset);
          const assetFromVisible = allKnownAssets.find((visibleAsset) =>
            assetsAreSame(visibleAsset, asset)
          );
          return {
            ...previousValue,
            [`${address}_${tokenId}`]: assetFromVisible ?? asset,
          };
        }, {})
      );
    }, [chainId, qsStoredTokens, quipuswapTokenWhitelists, allKnownAssets]);

    const noInitialAssetKeyKnownAssets = useMemo(() => {
      return Object.values(
        [...allKnownAssets, ...noInitialAssetKeyExchangableAssets].reduce<
          Record<string, TempleAsset>
        >((previousValue, asset) => {
          const { address, tokenId } = getAssetId(asset);
          return {
            ...previousValue,
            [`${address}_${tokenId}`]: asset,
          };
        }, {})
      );
    }, [allKnownAssets, noInitialAssetKeyExchangableAssets]);

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

      const tokenStandard = await detectTokenStandard(tezos, assetAddress);
      return (
        tokenStandard &&
        getAssetData(
          [],
          tokenStandard === "fa2"
            ? {
                address: assetAddress,
                tokenId: Number(rawAssetId),
              }
            : { address: assetAddress }
        )
      );
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
      const tokenStandard = await detectTokenStandard(tezos, assetAddress);
      if (tokenStandard === "fa2") {
        tokenId = Number(rawAssetId);
      }

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

          const tokenStandard = await detectTokenStandard(tezos, searchString);
          let exchangeContractAddress: string | undefined;
          let showTokenIdInput = false;

          if (tokenStandard === "fa2") {
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
          } else {
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
