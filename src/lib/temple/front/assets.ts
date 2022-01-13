import { useCallback, useEffect, useMemo, useRef } from 'react';

import constate from 'constate';
import deepEqual from 'fast-deep-equal';
import Fuse from 'fuse.js';
import useForceUpdate from 'use-force-update';
import { browser } from 'webextension-polyfill-ts';

import { createQueue } from 'lib/queue';
import { useRetryableSWR } from 'lib/swr';
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
  fetchFromStorage,
  fetchCollectibleTokens,
  fetchAllKnownCollectibleTokenSlugs,
  DetailedAssetMetdata,
  AssetTypesEnum,
  useChainId,
  useAccount,
  isTokenDisplayed
} from 'lib/temple/front';
import { ITokenStatus } from 'lib/temple/repo';

export const ALL_TOKENS_BASE_METADATA_STORAGE_KEY = 'tokens_base_metadata';

export function useDisplayedFungibleTokens(chainId: string, account: string) {
  return useRetryableSWR(
    ['displayed-fungible-tokens', chainId, account],
    () => fetchDisplayedFungibleTokens(chainId, account),
    {
      revalidateOnMount: true,
      refreshInterval: 20_000,
      dedupingInterval: 1_000
    }
  );
}

export function useFungibleTokens(chainId: string, account: string) {
  return useRetryableSWR(['fungible-tokens', chainId, account], () => fetchFungibleTokens(chainId, account), {
    revalidateOnMount: true,
    refreshInterval: 20_000,
    dedupingInterval: 5_000
  });
}

export function useCollectibleTokens(chainId: string, account: string, isDisplayed: boolean) {
  return useRetryableSWR(
    ['collectible-tokens', chainId, account, isDisplayed],
    () => fetchCollectibleTokens(chainId, account, isDisplayed),
    {
      revalidateOnMount: true,
      refreshInterval: 20_000,
      dedupingInterval: 5_000
    }
  );
}

export function useAllKnownFungibleTokenSlugs(chainId: string) {
  return useRetryableSWR(['all-known-fungible-token-slugs', chainId], () => fetchAllKnownFungibleTokenSlugs(chainId), {
    revalidateOnMount: true,
    refreshInterval: 60_000,
    dedupingInterval: 10_000
  });
}

export function useAllKnownCollectibleTokenSlugs(chainId: string) {
  return useRetryableSWR(
    ['all-known-collectible-token-slugs', chainId],
    () => fetchAllKnownCollectibleTokenSlugs(chainId),
    {
      revalidateOnMount: true,
      refreshInterval: 60_000,
      dedupingInterval: 10_000
    }
  );
}

const enqueueAutoFetchMetadata = createQueue();
const autoFetchMetadataFails = new Set<string>();

export function useAssetMetadata(slug: string) {
  const tezos = useTezos();
  const forceUpdate = useForceUpdate();

  const { allTokensBaseMetadataRef, fetchMetadata, setTokensBaseMetadata, setTokensDetailedMetadata } =
    useTokensMetadata();

  useEffect(
    () =>
      onStorageChanged(ALL_TOKENS_BASE_METADATA_STORAGE_KEY, newValue => {
        if (!deepEqual(newValue[slug], allTokensBaseMetadataRef.current[slug])) {
          forceUpdate();
        }
      }),
    [slug, allTokensBaseMetadataRef, forceUpdate]
  );

  const tezAsset = isTezAsset(slug);
  const tokenMetadata = allTokensBaseMetadataRef.current[slug] ?? null;
  const exist = Boolean(tokenMetadata);

  // Load token metadata if missing
  const tezosRef = useRef(tezos);
  useEffect(() => {
    tezosRef.current = tezos;
  }, [tezos]);

  useEffect(() => {
    if (!isTezAsset(slug) && !exist && !autoFetchMetadataFails.has(slug)) {
      enqueueAutoFetchMetadata(() => fetchMetadata(slug))
        .then(metadata =>
          Promise.all([
            setTokensBaseMetadata({ [slug]: metadata.base }),
            setTokensDetailedMetadata({ [slug]: metadata.detailed })
          ])
        )
        .catch(() => autoFetchMetadataFails.add(slug));
    }
  }, [slug, exist, fetchMetadata, setTokensBaseMetadata, setTokensDetailedMetadata]);

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
  const [initialAllTokensBaseMetadata] = usePassiveStorage<Record<string, AssetMetadata>>(
    ALL_TOKENS_BASE_METADATA_STORAGE_KEY,
    defaultAllTokensBaseMetadata
  );

  const allTokensBaseMetadataRef = useRef(initialAllTokensBaseMetadata);
  useEffect(
    () =>
      onStorageChanged(ALL_TOKENS_BASE_METADATA_STORAGE_KEY, newValue => {
        allTokensBaseMetadataRef.current = newValue;
      }),
    []
  );

  const tezos = useTezos();
  const tezosRef = useRef(tezos);
  useEffect(() => {
    tezosRef.current = tezos;
  }, [tezos]);

  const fetchMetadata = useCallback((slug: string) => fetchTokenMetadata(tezosRef.current, slug), []);

  const setTokensBaseMetadata = useCallback(
    (toSet: Record<string, AssetMetadata>) =>
      enqueueSetAllTokensBaseMetadata(() =>
        putToStorage(ALL_TOKENS_BASE_METADATA_STORAGE_KEY, {
          ...allTokensBaseMetadataRef.current,
          ...toSet
        })
      ),
    []
  );

  const setTokensDetailedMetadata = useCallback(
    (toSet: Record<string, DetailedAssetMetdata>) =>
      browser.storage.local.set(mapObjectKeys(toSet, getDetailedMetadataStorageKey)),
    []
  );

  return {
    allTokensBaseMetadataRef,
    fetchMetadata,
    setTokensBaseMetadata,
    setTokensDetailedMetadata
  };
});

export const useGetTokenMetadata = () => {
  const { allTokensBaseMetadataRef } = useTokensMetadata();

  return useCallback(
    (slug: string) => {
      if (isTezAsset(slug)) {
        return TEZOS_METADATA;
      }

      return allTokensBaseMetadataRef.current[slug];
    },
    [allTokensBaseMetadataRef]
  );
};

export function useDetailedAssetMetadata(slug: string) {
  const baseMetadata = useAssetMetadata(slug);

  const storageKey = useMemo(() => getDetailedMetadataStorageKey(slug), [slug]);

  const { data: detailedMetadata, mutate } = useRetryableSWR<DetailedAssetMetdata>(
    ['detailed-metadata', storageKey],
    fetchFromStorage,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );

  useEffect(() => onStorageChanged(storageKey, mutate), [storageKey, mutate]);

  return detailedMetadata ?? baseMetadata;
}

export function useAllTokensBaseMetadata() {
  const { allTokensBaseMetadataRef } = useTokensMetadata();
  const forceUpdate = useForceUpdate();

  useEffect(() => onStorageChanged(ALL_TOKENS_BASE_METADATA_STORAGE_KEY, forceUpdate), [forceUpdate]);

  return allTokensBaseMetadataRef.current;
}

type TokenStatuses = Record<string, { displayed: boolean; removed: boolean }>;

export const useAvailableAssets = (assetType: AssetTypesEnum) => {
  const chainId = useChainId(true)!;
  const account = useAccount();
  const allTokensBaseMetadata = useAllTokensBaseMetadata();

  const { data: allCollectiblesSlugs = [], isValidating: allKnownCollectiblesTokenSlugsLoading } =
    useAllKnownCollectibleTokenSlugs(chainId);
  const {
    data: collectibles = [],
    revalidate: revalidateCollectibles,
    isValidating: collectibleTokensLoading
  } = useCollectibleTokens(chainId, account.publicKeyHash, false);

  const { data: allTokenSlugs = [], isValidating: allKnownFungibleTokenSlugsLoading } =
    useAllKnownFungibleTokenSlugs(chainId);
  const {
    data: tokens = [],
    revalidate: revalidateTokens,
    isValidating: fungibleTokensLoading
  } = useFungibleTokens(chainId, account.publicKeyHash);

  const isCollectibles = assetType === AssetTypesEnum.Collectibles;
  const assets = isCollectibles ? collectibles : tokens;
  const slugs = isCollectibles ? allCollectiblesSlugs : allTokenSlugs;
  const revalidate = isCollectibles ? revalidateCollectibles : revalidateTokens;

  const isLoading =
    allKnownFungibleTokenSlugsLoading ||
    fungibleTokensLoading ||
    allKnownCollectiblesTokenSlugsLoading ||
    collectibleTokensLoading;

  const assetsStatuses = useMemo(() => {
    const statuses: TokenStatuses = {};
    for (const asset of assets) {
      statuses[asset.tokenSlug] = {
        displayed: isTokenDisplayed(asset),
        removed: asset.status === ITokenStatus.Removed
      };
    }
    return statuses;
  }, [assets]);

  const availableAssets = useMemo(
    () => slugs.filter(slug => slug in allTokensBaseMetadata && !assetsStatuses[slug]?.removed),
    [slugs, allTokensBaseMetadata, assetsStatuses]
  );

  return { availableAssets, assetsStatuses, isLoading, revalidate };
};

export function searchAssets(
  searchValue: string,
  assetSlugs: string[],
  allTokensBaseMetadata: Record<string, AssetMetadata>
) {
  if (!searchValue) return assetSlugs;

  const fuse = new Fuse(
    assetSlugs.map(slug => ({
      slug,
      metadata: isTezAsset(slug) ? TEZOS_METADATA : allTokensBaseMetadata[slug]
    })),
    {
      keys: [
        { name: 'metadata.name', weight: 0.9 },
        { name: 'metadata.symbol', weight: 0.7 },
        { name: 'slug', weight: 0.3 }
      ],
      threshold: 1
    }
  );

  return fuse.search(searchValue).map(({ item: { slug } }) => slug);
}

function getDetailedMetadataStorageKey(slug: string) {
  return `detailed_asset_metadata_${slug}`;
}

function mapObjectKeys<T extends Record<string, any>>(obj: T, predicate: (key: string) => string): T {
  const newObj: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    newObj[predicate(key)] = obj[key];
  }

  return newObj as T;
}
