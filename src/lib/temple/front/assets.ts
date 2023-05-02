import { useCallback, useMemo, useState } from 'react';

import { BigNumber } from 'bignumber.js';
import { useDebounce } from 'use-debounce';

import { useBalancesWithDecimals } from 'app/hooks/use-balances-with-decimals.hook';
import { useBalancesSelector } from 'app/store/balances/selectors';
import { useSwapTokensSelector } from 'app/store/swap/selectors';
import { useTokensMetadataSelector } from 'app/store/tokens-metadata/selectors';
import { AssetTypesEnum, isTezAsset, TEZ_TOKEN_SLUG, toAssetSlug } from 'lib/assets';
import { useUsdToTokenRates } from 'lib/fiat-currency/core';
import { FILM_METADATA, TEZOS_METADATA } from 'lib/metadata/defaults';
import type { AssetMetadataBase } from 'lib/metadata/types';
import { useRetryableSWR } from 'lib/swr';
import {
  fetchDisplayedFungibleTokens,
  fetchFungibleTokens,
  fetchAllKnownFungibleTokenSlugs,
  fetchCollectibleTokens,
  fetchAllKnownCollectibleTokenSlugs,
  isTokenDisplayed
} from 'lib/temple/assets';
import { useNetwork } from 'lib/temple/front';
import { ITokenStatus } from 'lib/temple/repo';
import { searchAndFilterItems } from 'lib/utils/search-items';

import { useChainId, useAccount } from './ready';

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

export function useCollectibleTokens(chainId: string, account: string, onlyDisplayed: boolean = false) {
  return useRetryableSWR(
    ['collectible-tokens', chainId, account, onlyDisplayed],
    () => fetchCollectibleTokens(chainId, account, onlyDisplayed),
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

export const useGasToken = () => {
  const { type } = useNetwork();

  return useMemo(
    () =>
      type === 'dcp'
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
          },
    [type]
  );
};

export const useGetTokenMetadata = () => {
  const allTokensMetadata = useTokensMetadataSelector();
  const { metadata } = useGasToken();

  return useCallback(
    (slug: string): AssetMetadataBase | undefined => {
      if (isTezAsset(slug)) {
        return metadata;
      }

      return allTokensMetadata[slug];
    },
    [allTokensMetadata, metadata]
  );
};

type TokenStatuses = Record<string, { displayed: boolean; removed: boolean }>;

export const useAvailableAssets = (assetType: AssetTypesEnum) => {
  const chainId = useChainId(true)!;
  const account = useAccount();
  const allTokensMetadata = useTokensMetadataSelector();

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
    () => slugs.filter(slug => slug in allTokensMetadata && !assetsStatuses[slug]?.removed),
    [slugs, allTokensMetadata, assetsStatuses]
  );

  return { availableAssets, assetsStatuses, isLoading, mutate };
};

export const useAvailableRoute3Tokens = () => {
  const { data: route3tokens, isLoading } = useSwapTokensSelector();

  const route3tokensSlugs = useMemo(() => {
    const result: Array<string> = [];

    for (const { contract, tokenId } of route3tokens) {
      if (contract !== null) {
        result.push(toAssetSlug(contract, tokenId ?? 0));
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
  const allTokensMetadata = useTokensMetadataSelector();
  const assetsSortPredicate = useAssetsSortPredicate();

  const [searchValue, setSearchValue] = useState('');
  const [tokenId, setTokenId] = useState<number>();
  const [searchValueDebounced] = useDebounce(tokenId ? toAssetSlug(searchValue, tokenId) : searchValue, 300);

  const filteredAssets = useMemo(
    () =>
      searchAssetsWithNoMeta(searchValueDebounced, assetSlugs, allTokensMetadata, slug => slug).sort(
        assetsSortPredicate
      ),
    [searchValueDebounced, assetSlugs, allTokensMetadata, assetsSortPredicate]
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
  const allTokensMetadata = useTokensMetadataSelector();
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
  const [searchValueDebounced] = useDebounce(tokenId ? toAssetSlug(searchValue, tokenId) : searchValue, 300);

  const filteredAssets = useMemo(
    () => searchAssetsWithNoMeta(searchValueDebounced, assetSlugs, allTokensMetadata, slug => slug),
    [searchValueDebounced, assetSlugs, allTokensMetadata]
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
  tokensMetadata: Record<string, AssetMetadataBase>,
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
        metadata: isTezAsset(slug) ? TEZOS_METADATA : tokensMetadata[slug]
      };
    }
  );
}
