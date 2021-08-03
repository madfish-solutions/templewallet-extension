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

export function useAssetMetadata(slug: string) {
  const tezos = useTezos();

  const [tokenMetadata, setTokenMetadata] = useTokenMetadata(slug);

  const tezAsset = isTezAsset(slug);
  const exist = Boolean(tokenMetadata);

  // Load token metadata if missing
  const tezosRef = useRef(tezos);
  useEffect(() => {
    tezosRef.current = tezos;
  }, [tezos]);

  useEffect(() => {
    if (!isTezAsset(slug) && !exist) {
      fetchTokenMetadata(tezosRef.current, slug)
        .then((metadata) => setTokenMetadata(metadata.base))
        .catch((err) => {
          if (process.env.NODE_ENV === "development") {
            console.error(err);
          }
        });
    }
  }, [slug, exist, setTokenMetadata]);

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

const enqueueSetTokenMetadata = createQueue();

export function useTokenMetadata(
  slug: string
): [AssetMetadata | null, (metadata: AssetMetadata) => Promise<void>] {
  const [tokensBaseMetadata, setTokensBaseMetadata] = useTokensBaseMetadata();
  const metadata = tokensBaseMetadata[slug] ?? null;

  const setMetadata = useCallback(
    async (metadata: AssetMetadata) => {
      enqueueSetTokenMetadata(() =>
        setTokensBaseMetadata((allMetadata) => ({
          ...allMetadata,
          [slug]: metadata,
        }))
      );
    },
    [slug, setTokensBaseMetadata]
  );

  return [metadata, setMetadata];
}

const defaultTokensBaseMetadata = {};

export const [TokensBaseMetadataProvider, useTokensBaseMetadata] = constate(
  useTokensBaseMetadataPure
);

export function useTokensBaseMetadataPure() {
  return useStorage<Record<string, AssetMetadata>>(
    "tokens_base_metadata",
    defaultTokensBaseMetadata
  );
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
