import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { BigNumber } from 'bignumber.js';
import constate from 'constate';
import deepEqual from 'fast-deep-equal';
import { useDebounce } from 'use-debounce';
import useForceUpdate from 'use-force-update';
import browser from 'webextension-polyfill';

import { useBalancesWithDecimals } from 'app/hooks/use-balances-with-decimals.hook';
import { useBalancesSelector } from 'app/store/balances/selectors';
import { useSwapTokensSelector } from 'app/store/swap/selectors';
import { useUsdToTokenRates } from 'lib/fiat-currency/core';
import { useRetryableSWR } from 'lib/swr';
import {
  AssetTypesEnum,
  isTezAsset,
  fetchDisplayedFungibleTokens,
  fetchFungibleTokens,
  fetchAllKnownFungibleTokenSlugs,
  fetchCollectibleTokens,
  fetchAllKnownCollectibleTokenSlugs,
  isTokenDisplayed,
  toTokenSlug
} from 'lib/temple/assets';
import { useNetwork } from 'lib/temple/front';
import { ITokenStatus } from 'lib/temple/repo';
import { createQueue } from 'lib/utils';
import { searchAndFilterItems } from 'lib/utils/search-items';

import {
  AssetMetadata,
  DetailedAssetMetdata,
  fetchTokenMetadata,
  FILM_METADATA,
  PRESERVED_TOKEN_METADATA,
  TEZOS_METADATA
} from '../metadata';
import { useTezosRef, useChainId, useAccount } from './ready';
import { onStorageChanged, putToStorage, usePassiveStorage } from './storage';

const ALL_TOKENS_BASE_METADATA_STORAGE_KEY = 'tokens_base_metadata';

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

function useFungibleTokens(chainId: string, account: string) {
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

function useAllKnownFungibleTokenSlugs(chainId: string) {
  return useRetryableSWR(['all-known-fungible-token-slugs', chainId], () => fetchAllKnownFungibleTokenSlugs(chainId), {
    revalidateOnMount: true,
    refreshInterval: 60_000,
    dedupingInterval: 10_000
  });
}

function useAllKnownCollectibleTokenSlugs(chainId: string) {
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

export const TEZ_TOKEN_SLUG = 'tez';

export const useGasToken = () => {
  const network = useNetwork();

  return network.type === 'dcp'
    ? {
        logo: 'misc/token-logos/film.png',
        symbol: 'ф',
        assetName: 'FILM',
        metadata: FILM_METADATA,
        isDcpNetwork: true
      }
    : {
        logo: 'misc/token-logos/tez.svg',
        symbol: 'ꜩ',
        assetName: 'tez',
        metadata: TEZOS_METADATA
      };
};

export function useAssetMetadata(slug: string): AssetMetadata | null {
  const forceUpdate = useForceUpdate();
  const { metadata } = useGasToken();

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

  const getCurrentBaseMetadata = useMemo(
    () => (): AssetMetadata | null => allTokensBaseMetadataRef.current[slug] ?? null,
    [slug, allTokensBaseMetadataRef.current]
  );

  const tezAsset = isTezAsset(slug);
  const tokenMetadata = getCurrentBaseMetadata();
  const exist = Boolean(tokenMetadata);

  useEffect(() => {
    if (isTezAsset(slug) || exist || autoFetchMetadataFails.has(slug)) return;
    enqueueAutoFetchMetadata(async () => {
      if (getCurrentBaseMetadata()) return;
      const metadata = await fetchMetadata(slug);
      if (metadata == null) throw new Error('');
      return metadata;
    })
      .then(metadata => {
        return (
          metadata &&
          Promise.all([
            setTokensBaseMetadata({ [slug]: metadata.base }),
            setTokensDetailedMetadata({ [slug]: metadata.detailed })
          ])
        );
      })
      .catch(() => autoFetchMetadataFails.add(slug));
  }, [slug, exist, getCurrentBaseMetadata, fetchMetadata, setTokensBaseMetadata, setTokensDetailedMetadata]);

  // Tezos
  if (tezAsset) {
    return metadata;
  }

  // Preserved for legacy tokens
  if (!exist && PRESERVED_TOKEN_METADATA.has(slug)) {
    return PRESERVED_TOKEN_METADATA.get(slug)!;
  }

  return tokenMetadata;
}

const defaultAllTokensBaseMetadata = {
  tez: {
    decimals: 6,
    symbol: 'TEZ',
    name: 'Tezos'
  }
};
const enqueueSetAllTokensBaseMetadata = createQueue();

export const [TokensMetadataProvider, useTokensMetadata] = constate(() => {
  const [initialAllTokensBaseMetadata] = usePassiveStorage<Record<string, AssetMetadata>>(
    ALL_TOKENS_BASE_METADATA_STORAGE_KEY,
    defaultAllTokensBaseMetadata
  );

  const allTokensBaseMetadataRef = useRef(initialAllTokensBaseMetadata);

  const tezosRef = useTezosRef();

  const fetchMetadata = (slug: string) => fetchTokenMetadata(tezosRef.current, slug);

  const setTokensBaseMetadata = useCallback(
    (toSet: Record<string, AssetMetadata>) =>
      enqueueSetAllTokensBaseMetadata(() => {
        allTokensBaseMetadataRef.current = {
          ...allTokensBaseMetadataRef.current,
          ...toSet
        };
        return putToStorage(ALL_TOKENS_BASE_METADATA_STORAGE_KEY, allTokensBaseMetadataRef.current);
      }),
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
  const { metadata } = useGasToken();

  return useCallback(
    (slug: string): AssetMetadata | undefined => {
      if (isTezAsset(slug)) {
        return metadata;
      }

      return allTokensBaseMetadataRef.current[slug];
    },
    [allTokensBaseMetadataRef, metadata]
  );
};

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
    mutate: mutateCollectibles,
    isValidating: collectibleTokensLoading
  } = useCollectibleTokens(chainId, account.publicKeyHash, false);

  const { data: allTokenSlugs = [], isValidating: allKnownFungibleTokenSlugsLoading } =
    useAllKnownFungibleTokenSlugs(chainId);
  const {
    data: tokens = [],
    mutate: mutateTokens,
    isValidating: fungibleTokensLoading
  } = useFungibleTokens(chainId, account.publicKeyHash);

  const isCollectibles = assetType === AssetTypesEnum.Collectibles;
  const assets = isCollectibles ? collectibles : tokens;
  const slugs = isCollectibles ? allCollectiblesSlugs : allTokenSlugs;
  const mutate = isCollectibles ? mutateCollectibles : mutateTokens;

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

  return { availableAssets, assetsStatuses, isLoading, mutate };
};

export const useAvailableRoute3Tokens = () => {
  const { data: route3tokens, isLoading } = useSwapTokensSelector();

  const route3tokensSlugs = useMemo(() => {
    const result: Array<string> = [];

    for (const { contract, tokenId } of route3tokens) {
      if (contract !== null) {
        result.push(toTokenSlug(contract, tokenId ?? 0));
      }
    }

    return result;
  }, [route3tokens]);

  return {
    isLoading,
    route3tokens,
    route3tokensSlugs
  };
};
function makeAssetsSortPredicate(balances: Record<string, BigNumber>, fiatToTokenRates: Record<string, string>) {
  return (tokenASlug: string, tokenBSlug: string) => {
    if (tokenASlug === TEZ_TOKEN_SLUG) {
      return -1;
    }

    if (tokenBSlug === TEZ_TOKEN_SLUG) {
      return 1;
    }

    const tokenABalance = balances[tokenASlug] ?? new BigNumber(0);
    const tokenBBalance = balances[tokenBSlug] ?? new BigNumber(0);
    const tokenAEquity = tokenABalance.multipliedBy(fiatToTokenRates[tokenASlug] ?? 0);
    const tokenBEquity = tokenBBalance.multipliedBy(fiatToTokenRates[tokenBSlug] ?? 0);

    if (tokenAEquity.isEqualTo(tokenBEquity)) {
      return tokenBBalance.comparedTo(tokenABalance);
    }

    return tokenBEquity.comparedTo(tokenAEquity);
  };
}

export function useAssetsSortPredicate() {
  const balances = useBalancesWithDecimals();
  const usdToTokenRates = useUsdToTokenRates();

  return useCallback(
    (tokenASlug: string, tokenBSlug: string) =>
      makeAssetsSortPredicate(balances, usdToTokenRates)(tokenASlug, tokenBSlug),
    [balances, usdToTokenRates]
  );
}

export function useFilteredAssets(assetSlugs: string[]) {
  const allTokensBaseMetadata = useAllTokensBaseMetadata();
  const assetsSortPredicate = useAssetsSortPredicate();

  const [searchValue, setSearchValue] = useState('');
  const [tokenId, setTokenId] = useState<number>();
  const [searchValueDebounced] = useDebounce(tokenId ? toTokenSlug(searchValue, tokenId) : searchValue, 300);

  const filteredAssets = useMemo(
    () =>
      searchAssetsWithNoMeta(searchValueDebounced, assetSlugs, allTokensBaseMetadata, slug => slug).sort(
        assetsSortPredicate
      ),
    [searchValueDebounced, assetSlugs, allTokensBaseMetadata, assetsSortPredicate]
  );

  return {
    filteredAssets,
    searchValue,
    setSearchValue,
    tokenId,
    setTokenId
  };
}
export function useFilteredSwapAssets(inputName: string = 'input') {
  const allTokensBaseMetadata = useAllTokensBaseMetadata();
  const { route3tokensSlugs } = useAvailableRoute3Tokens();
  const { publicKeyHash } = useAccount();
  const chainId = useChainId(true)!;
  const balances = useBalancesSelector(publicKeyHash, chainId);

  const assetSlugs = useMemo(() => {
    if (inputName === 'input') {
      const result: Array<string> = [TEZ_TOKEN_SLUG];

      for (const slug of route3tokensSlugs) {
        const balance = balances[slug];

        if (balance !== undefined && balance !== '0') {
          result.push(slug);
        }
      }

      return result;
    }

    return [TEZ_TOKEN_SLUG, ...route3tokensSlugs];
  }, [route3tokensSlugs, balances]);

  const [searchValue, setSearchValue] = useState('');
  const [tokenId, setTokenId] = useState<number>();
  const [searchValueDebounced] = useDebounce(tokenId ? toTokenSlug(searchValue, tokenId) : searchValue, 300);

  const filteredAssets = useMemo(
    () => searchAssetsWithNoMeta(searchValueDebounced, assetSlugs, allTokensBaseMetadata, slug => slug),
    [searchValueDebounced, assetSlugs, allTokensBaseMetadata]
  );

  return {
    filteredAssets,
    searchValue,
    setSearchValue,
    tokenId,
    setTokenId
  };
}

export function searchAssetsWithNoMeta<T>(
  searchValue: string,
  assets: T[],
  allTokensBaseMetadata: Record<string, AssetMetadata>,
  getSlug: (asset: T) => string
) {
  return searchAndFilterItems(
    assets,
    searchValue,
    [
      { name: 'metadata.symbol', weight: 1 },
      { name: 'metadata.name', weight: 0.25 },
      { name: 'slug', weight: 0.1 }
    ],
    asset => {
      const slug = getSlug(asset);
      return {
        slug,
        metadata: isTezAsset(slug) ? TEZOS_METADATA : allTokensBaseMetadata[slug]
      };
    }
  );
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
