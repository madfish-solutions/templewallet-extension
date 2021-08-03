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
} from "lib/temple/front";
import * as Repo from "lib/temple/repo";

export function useAccountTokensLazy(chainId: string, address: string) {
  return useRetryableSWR(
    ["tokens", chainId, address],
    () =>
      Repo.accountTokens
        .where({ chainId, address })
        .toArray()
        .then((tokens) => tokens.map(({ tokenSlug }) => tokenSlug)),
    {
      revalidateOnMount: true,
      refreshInterval: 20_000,
      dedupingInterval: 3_000,
    }
  );
}

const enqueueAutoFetchTokenMetadata = createQueue();

export function useAssetMetadata(slug: string) {
  const tezos = useTezos();

  const { tokensBaseMetadata, fetchMetadata, setTokenBaseMetadata } =
    useTokensMetadata();

  const tezAsset = isTezAsset(slug);
  const tokenMetadata = tokensBaseMetadata[slug];
  const exist = Boolean(tokenMetadata);

  // Load token metadata if missing
  const tezosRef = useRef(tezos);
  useEffect(() => {
    tezosRef.current = tezos;
  }, [tezos]);

  useEffect(() => {
    if (!isTezAsset(slug) && !exist) {
      enqueueAutoFetchTokenMetadata(() => fetchMetadata(slug))
        .then((metadata) => setTokenBaseMetadata(slug, metadata.base))
        .catch((err) => {
          if (process.env.NODE_ENV === "development") {
            console.error(err);
          }
        });
    }
  }, [slug, exist, fetchMetadata, setTokenBaseMetadata]);

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

export const [TokensMetadataProvider, useTokensMetadata] = constate(
  useTokensMetadataPure
);

const defaultTokensBaseMetadata = {};
const enqueueSetTokenBaseMetadata = createQueue();

export function useTokensMetadataPure() {
  const [tokensBaseMetadata, setTokensBaseMetadata] = useStorage<
    Record<string, AssetMetadata>
  >("tokens_base_metadata", defaultTokensBaseMetadata);

  const tezos = useTezos();
  const tezosRef = useRef(tezos);
  useEffect(() => {
    tezosRef.current = tezos;
  }, [tezos]);

  const fetchMetadata = useCallback(
    async (slug: string) => fetchTokenMetadata(tezosRef.current, slug),
    []
  );

  const setTokenBaseMetadata = useCallback(
    (slug: string, metadata: AssetMetadata) =>
      enqueueSetTokenBaseMetadata(() =>
        setTokensBaseMetadata((allMetadata) => ({
          ...allMetadata,
          [slug]: metadata,
        }))
      ),
    [setTokensBaseMetadata]
  );

  return { fetchMetadata, tokensBaseMetadata, setTokenBaseMetadata };
}

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
