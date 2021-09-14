import { useCallback, useEffect, useRef } from "react";

import constate from "constate";
import deepEqual from "fast-deep-equal";
import Fuse from "fuse.js";
import useForceUpdate from "use-force-update";

import { createQueue } from "lib/queue";
import { useRetryableSWR } from "lib/swr";
import {
  useTezos,
  usePassiveStorage,
  isTezAsset,
  AssetMetadata,
  fetchTokenMetadata,
  PRESERVED_TOKEN_METADATA,
  TEZOS_METADATA,
  fetchDisplayedFungibleTokens,
  fetchFungibleTokens,
  fetchAllKnownFungibleTokenSlugs,
  onStorageChanged,
  putToStorage,
} from "lib/temple/front";

export const ALL_ASSETS_BASE_METADATA_STORAGE_KEY = "all_tokens_base_metadata";

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
  const forceUpdate = useForceUpdate();

  const { allAssetsBaseMetadataRef, fetchMetadata, setAssetsBaseMetadata } =
    useAssetsMetadata();

  useEffect(
    () =>
      onStorageChanged(ALL_ASSETS_BASE_METADATA_STORAGE_KEY, (newValue) => {
        if (
          !deepEqual(newValue[slug], allAssetsBaseMetadataRef.current[slug])
        ) {
          forceUpdate();
        }
      }),
    [slug, allAssetsBaseMetadataRef, forceUpdate]
  );

  const tezAsset = isTezAsset(slug);
  const tokenMetadata = allAssetsBaseMetadataRef.current[slug];
  const exist = Boolean(tokenMetadata);

  // Load token metadata if missing
  const tezosRef = useRef(tezos);
  useEffect(() => {
    tezosRef.current = tezos;
  }, [tezos]);

  useEffect(() => {
    if (!isTezAsset(slug) && !exist && !autoFetchMetadataFails.has(slug)) {
      enqueueAutoFetchMetadata(() => fetchMetadata(slug))
        .then((metadata) => setAssetsBaseMetadata({ [slug]: metadata.base }))
        .catch(() => autoFetchMetadataFails.add(slug));
    }
  }, [slug, exist, fetchMetadata, setAssetsBaseMetadata]);

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

export const [AssetsMetadataProvider, useAssetsMetadata] = constate(() => {
  const [initialAllTokensBaseMetadata] = usePassiveStorage<
    Record<string, AssetMetadata>
  >(ALL_ASSETS_BASE_METADATA_STORAGE_KEY, defaultAllTokensBaseMetadata);

  const allAssetsBaseMetadataRef = useRef(initialAllTokensBaseMetadata);
  useEffect(
    () =>
      onStorageChanged(ALL_ASSETS_BASE_METADATA_STORAGE_KEY, (newValue) => {
          allAssetsBaseMetadataRef.current = newValue;
      }),
    []
  );

  const tezos = useTezos();
  const tezosRef = useRef(tezos);
  useEffect(() => {
    tezosRef.current = tezos;
  }, [tezos]);

  const fetchMetadata = useCallback(
    (slug: string) => fetchTokenMetadata(tezosRef.current, slug),
    []
  );

  const setAssetsBaseMetadata = useCallback(
    (toSet: Record<string, AssetMetadata>) =>
      enqueueSetAllTokensBaseMetadata(() =>
        putToStorage(ALL_ASSETS_BASE_METADATA_STORAGE_KEY, {
          ...allAssetsBaseMetadataRef.current,
          ...toSet,
        })
      ),
    []
  );

  return {
    allAssetsBaseMetadataRef,
    setAssetsBaseMetadata,
    fetchMetadata,
  };
});

export function useAllAssetsBaseMetadata() {
  const { allAssetsBaseMetadataRef } = useAssetsMetadata();
  const forceUpdate = useForceUpdate();

  useEffect(
    () => onStorageChanged(ALL_ASSETS_BASE_METADATA_STORAGE_KEY, forceUpdate),
    [forceUpdate]
  );

  return allAssetsBaseMetadataRef.current;
}

export function useAllCollectiblesBaseMetadata() {
    const { allAssetsBaseMetadataRef } = useAssetsMetadata();
    const forceUpdate = useForceUpdate();

    const allCollectiblesBaseMetadata = Object.assign({});

    for (const asset in allAssetsBaseMetadataRef.current) {
        if (allAssetsBaseMetadataRef.current[asset].hasOwnProperty('artifactUri')) {
            allCollectiblesBaseMetadata[asset] = allAssetsBaseMetadataRef.current[asset]
        }
    }

    useEffect(
        () => onStorageChanged(ALL_ASSETS_BASE_METADATA_STORAGE_KEY, forceUpdate),
        [forceUpdate]
    );

    return allCollectiblesBaseMetadata;
}

export function searchAssets(
  searchValue: string,
  assetSlugs: string[],
  allTokensBaseMetadata: Record<string, AssetMetadata>
) {
  if (!searchValue) return assetSlugs;

  const fuse = new Fuse(
    assetSlugs.map((slug) => ({
      slug,
      metadata: isTezAsset(slug) ? TEZOS_METADATA : allTokensBaseMetadata[slug],
    })),
    {
      keys: [
        { name: "metadata.name", weight: 0.9 },
        { name: "metadata.symbol", weight: 0.7 },
        { name: "slug", weight: 0.3 },
      ],
      threshold: 1,
    }
  );

  return fuse.search(searchValue).map(({ item: { slug } }) => slug);
}
