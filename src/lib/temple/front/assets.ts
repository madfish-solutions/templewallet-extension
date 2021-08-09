import { useCallback, useEffect, useMemo, useRef } from "react";

import constate from "constate";

import { createQueue } from "lib/queue";
import { useRetryableSWR } from "lib/swr";
import {
  TEZ_ASSET,
  useTokens,
  useAllAssetsRef,
  getAssetKey,
  TempleAsset,
  useTezos,
  useStorage,
  isTezAsset,
  AssetMetadata,
  fetchTokenMetadata,
  PRESERVED_TOKEN_METADATA,
  TEZOS_METADATA,
  fetchDisplayedFungibleTokens,
  fetchFungibleTokens,
  fetchAllKnownFungibleTokenSlugs,
} from "lib/temple/front";

export function useDisplayedFungibleTokens(chainId: string, account: string) {
  return useRetryableSWR(
    ["displayed-fungible-tokens", chainId, account],
    () => fetchDisplayedFungibleTokens(chainId, account),
    {
      revalidateOnMount: true,
      refreshInterval: 20_000,
      dedupingInterval: 1_000,
    }
  );
}

export function useFungibleTokens(chainId: string, account: string) {
  return useRetryableSWR(
    ["fungible-tokens", chainId, account],
    () => fetchFungibleTokens(chainId, account),
    {
      revalidateOnMount: true,
      refreshInterval: 20_000,
      dedupingInterval: 5_000,
    }
  );
}

export function useAllKnownFungibleTokenSlugs(chainId: string) {
  return useRetryableSWR(
    ["all-known-fungible-token-slugs", chainId],
    () => fetchAllKnownFungibleTokenSlugs(chainId),
    {
      revalidateOnMount: true,
      refreshInterval: 60_000,
      dedupingInterval: 10_000,
    }
  );
}

const enqueueAutoFetchMetadata = createQueue();
const autoFetchMetadataFails = new Set<string>();

export function useAssetMetadata(slug: string) {
  const tezos = useTezos();

  const { allTokensBaseMetadata, fetchMetadata, setTokensBaseMetadata } =
    useTokensMetadata();

  const tezAsset = isTezAsset(slug);
  const tokenMetadata = allTokensBaseMetadata[slug];
  const exist = Boolean(tokenMetadata);

  // Load token metadata if missing
  const tezosRef = useRef(tezos);
  useEffect(() => {
    tezosRef.current = tezos;
  }, [tezos]);

  useEffect(() => {
    if (!isTezAsset(slug) && !exist && !autoFetchMetadataFails.has(slug)) {
      enqueueAutoFetchMetadata(() => fetchMetadata(slug))
        .then((metadata) => setTokensBaseMetadata({ [slug]: metadata.base }))
        .catch(() => autoFetchMetadataFails.add(slug));
    }
  }, [slug, exist, fetchMetadata, setTokensBaseMetadata]);

  // Tezos
  if (tezAsset) {
    return TEZOS_METADATA;
  }

  // Preserved for legacy tokens
  if (!exist && PRESERVED_TOKEN_METADATA.has(slug)) {
    return PRESERVED_TOKEN_METADATA.get(slug)!;
  }

  return tokenMetadata;
}

const defaultAllTokensBaseMetadata = {};
const enqueueSetAllTokensBaseMetadata = createQueue();

export const [TokensMetadataProvider, useTokensMetadata] = constate(() => {
  const [allTokensBaseMetadata, setAllTokensBaseMetadata] = useStorage<
    Record<string, AssetMetadata>
  >("all_tokens_base_metadata", defaultAllTokensBaseMetadata);

  const tezos = useTezos();
  const tezosRef = useRef(tezos);
  useEffect(() => {
    tezosRef.current = tezos;
  }, [tezos]);

  const fetchMetadata = useCallback(
    (slug: string) => fetchTokenMetadata(tezosRef.current, slug),
    []
  );

  const setTokensBaseMetadata = useCallback(
    (toSet: Record<string, AssetMetadata>) =>
      enqueueSetAllTokensBaseMetadata(() =>
        setAllTokensBaseMetadata((current) => ({ ...current, ...toSet }))
      ),
    [setAllTokensBaseMetadata]
  );

  return {
    allTokensBaseMetadata,
    setTokensBaseMetadata,
    fetchMetadata,
  };
});

export function useAssets() {
  const { allTokens, displayedTokens } = useTokens();
  const allAssetsRef = useAllAssetsRef();

  const allAssets = useMemo(
    () => [TEZ_ASSET, ...displayedTokens],
    [displayedTokens]
  );
  const allAssetsWithHidden = useMemo(
    () => [TEZ_ASSET, ...allTokens],
    [allTokens]
  );

  useEffect(() => {
    allAssetsRef.current = allAssets;
  }, [allAssetsRef, allAssets]);

  const defaultAsset = useMemo(() => allAssets[0], [allAssets]);

  return { allAssets, allAssetsWithHidden, defaultAsset };
}

export function useAssetBySlug(slug?: string | null) {
  const { allAssets } = useAssets();
  const asset = useMemo(
    () => allAssets.find((a) => getAssetKey(a) === slug) ?? null,
    [allAssets, slug]
  );
  return useMemo(() => asset, [asset]);
}

export const ASSET_FIELDS_TO_SEARCH = ["symbol", "name", "address"];

export function searchAssets<T extends TempleAsset>(
  assets: T[],
  searchValue: string
) {
  if (!searchValue) return assets;

  const loweredSearchValue = searchValue.toLowerCase();
  return assets.filter((a) =>
    ASSET_FIELDS_TO_SEARCH.some((field) =>
      (a as any)[field]?.toLowerCase().includes(loweredSearchValue)
    )
  );
}
