import { useCallback, useEffect, useMemo } from "react";

import { cache, mutate } from "swr";

import { t } from "lib/i18n/react";
import {
  useNetwork,
  useStorage,
  TempleToken,
  TempleAssetType,
  useCustomChainId,
  fetchFromStorage,
  assetsAreSame,
  loadChainId,
  TempleChainId,
  MAINNET_TOKENS,
  DELPHINET_TOKENS,
} from "lib/temple/front";
import { createQueue } from "lib/queue";

import { omitAssets } from "../assets";
import { useAllNetworks, useTezos } from "./ready";
import { fetchTokenMetadata, TokenMetadata } from "../contract";

const NETWORK_TOKEN_MAP = new Map([
  [TempleChainId.Mainnet, MAINNET_TOKENS],
  [TempleChainId.Delphinet, DELPHINET_TOKENS],
]);

const enqueueSetTokensMetadata = createQueue();

export function useAssetMetadata(assetSlug: string) {
  const tezos = useTezos();

  const [tokensMetadata, setTokensMetadata] = useStorage<
    Record<string, TokenMetadata>
  >("tokens_metadata", {});

  useEffect(() => {
    if (!isTezAsset(assetSlug) && !(assetSlug in tokensMetadata)) {
      const [contractAddress, tokenIdStr] = assetSlug.split("_");

      fetchTokenMetadata(
        tezos,
        contractAddress,
        tokenIdStr ? +tokenIdStr : undefined
      )
        .then((tokenMetadata) =>
          enqueueSetTokensMetadata(() =>
            setTokensMetadata((allMetadata) => ({
              ...allMetadata,
              [assetSlug]: tokenMetadata,
            }))
          )
        )
        .catch((err) => {
          if (process.env.NODE_ENV === "development") {
            console.error(err);
          }
        });
    }
  }, [tezos, assetSlug, tokensMetadata, setTokensMetadata]);

  const [metadata, setMetadata] = useStorage(`metadata_${assetSlug}`, null);
  return isTezAsset(assetSlug) ? [TEZOS_METADATA] : [metadata, setMetadata];
}

// Helpers

export function toAssetSlug(asset: Asset) {
  return isTezAsset(asset) ? asset : toTokenSlug(asset.contract, asset.id);
}

export function toTokenSlug(contract: string, id = 0) {
  return `${contract}_${id}`;
}

export function isFA2Token(token: Token): token is FA2Token {
  return typeof token.id !== "undefined";
}

export function isTezAsset(asset: Asset | string): asset is "tez" {
  return asset === "tez";
}

export function isTokenAsset(asset: Asset): asset is Token {
  return asset !== "tez";
}

// Defaults

export const TEZOS_METADATA: AssetMetadata = {
  decimals: 6,
  symbol: "XTZ",
  name: "Tezos",
  thumbnailUri: "https://cryptologos.cc/logos/tezos-xtz-logo.png",
};

// Types

export interface AssetMetadata {
  decimals: number;
  symbol: string;
  name: string;
  shortName?: string;
  thumbnailUri?: string;
}

export interface Token {
  contract: string;
  id?: number;
}

export interface FA2Token extends Token {
  id: number;
}

export type Asset = Token | "tez";

export function useTokens(networkRpc?: string) {
  const allNetworks = useAllNetworks();
  const selectedNetwork = useNetwork();

  const network = useMemo(() => {
    if (!networkRpc) return selectedNetwork;
    return (
      allNetworks.find(
        (n) => n.rpcBaseURL === networkRpc || n.id === networkRpc
      ) ?? selectedNetwork
    );
  }, [allNetworks, selectedNetwork, networkRpc]);

  const chainId = useCustomChainId(network.rpcBaseURL, true)!;

  const [tokensPure, saveTokens] = useStorage<TempleToken[]>(
    getTokensSWRKey(chainId),
    []
  );

  const savedTokens = useMemo(() => tokensPure.map(formatSaved), [tokensPure]);

  const staticTokens = useMemo(
    () => (chainId && NETWORK_TOKEN_MAP.get(chainId as TempleChainId)) || [],
    [chainId]
  );

  const allTokens = useMemo(
    () => [...omitAssets(staticTokens, savedTokens), ...savedTokens],
    [staticTokens, savedTokens]
  );

  const displayedTokens = useMemo(
    () => allTokens.filter((t) => t.status === "displayed"),
    [allTokens]
  );

  const hiddenTokens = useMemo(
    () => allTokens.filter((t) => t.status === "hidden"),
    [allTokens]
  );

  const displayedAndHiddenTokens = useMemo(
    () => allTokens.filter((t) => t.status !== "removed"),
    [allTokens]
  );

  const removedTokens = useMemo(
    () => allTokens.filter((t) => t.status === "removed"),
    [allTokens]
  );

  const updateToken = useCallback(
    (token: TempleToken, toUpdate: Partial<TempleToken>) =>
      saveTokens((tkns) => {
        const savedIndex = tkns.findIndex((t) => assetsAreSame(t, token));
        if (savedIndex !== -1) {
          return tkns.map((t, i) =>
            i === savedIndex ? ({ ...t, ...toUpdate } as TempleToken) : t
          );
        }

        const staticItem = staticTokens.find((t) => assetsAreSame(t, token));
        if (staticItem) {
          return [{ ...staticItem, ...toUpdate } as TempleToken, ...tkns];
        }

        return tkns;
      }),
    [saveTokens, staticTokens]
  );

  const addToken = useCallback(
    (token: TempleToken) => {
      if (displayedTokens.some((t) => assetsAreSame(t, token))) {
        if (token.type === TempleAssetType.FA2) {
          throw new Error(
            t("fa2TokenAlreadyExists", [token.address, token.id])
          );
        } else {
          throw new Error(t("nonFa2TokenAlreadyExists", token.address));
        }
      } else if (hiddenTokens.some((t) => assetsAreSame(t, token))) {
        return updateToken(token, token);
      }

      return saveTokens((tkns) => [
        ...tkns.filter((t) => !assetsAreSame(t, token)),
        token,
      ]);
    },
    [displayedTokens, hiddenTokens, updateToken, saveTokens]
  );

  return {
    savedTokens,
    staticTokens,
    displayedTokens,
    hiddenTokens,
    displayedAndHiddenTokens,
    removedTokens,
    allTokens,
    updateToken,
    addToken,
  };
}

export async function preloadTokens(rpcUrl: string) {
  const chainId = await loadChainId(rpcUrl);
  const tokensKey = getTokensSWRKey(chainId);

  await Promise.all(
    [
      {
        key: tokensKey,
        factory: () => fetchFromStorage(tokensKey),
      },
      {
        key: getCustomChainIdSWRKey(rpcUrl),
        factory: () => Promise.resolve(chainId),
      },
    ]
      .filter(({ key }) => !cache.has(key))
      .map(({ key, factory }) => mutate(key, factory))
  );
}

export function getTokensSWRKey(chainId: string) {
  return `tokens_${chainId}`;
}

export function getCustomChainIdSWRKey(rpcUrl: string) {
  return ["custom-chain-id", rpcUrl];
}

function formatSaved(t: TempleToken) {
  return { ...t, decimals: +t.decimals };
}
