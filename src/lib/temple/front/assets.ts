import { useCallback, useMemo, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import { BigNumber } from 'bignumber.js';
import { ScopedMutator } from 'swr/dist/types';
import { useDebounce } from 'use-debounce';

import { useBalancesWithDecimals } from 'app/hooks/use-balances-with-decimals.hook';
import { useTokensMetadataSelector } from 'app/store/tokens-metadata/selectors';
import { isTezAsset, TEMPLE_TOKEN_SLUG, toTokenSlug } from 'lib/assets';
import { AssetTypesEnum } from 'lib/assets/types';
import { useAccountBalances } from 'lib/balances';
import { useUsdToTokenRates } from 'lib/fiat-currency/core';
import { TOKENS_SYNC_INTERVAL } from 'lib/fixed-times';
import { isCollectible, useTokensMetadataWithPresenceCheck } from 'lib/metadata';
import { FILM_METADATA, TEZOS_METADATA } from 'lib/metadata/defaults';
import type { AssetMetadataBase } from 'lib/metadata/types';
import { useRetryableSWR } from 'lib/swr';
import { getStoredTokens, getAllStoredTokensSlugs, isTokenDisplayed } from 'lib/temple/assets';
import { useNetwork } from 'lib/temple/front';
import { ITokenStatus } from 'lib/temple/repo';
import { searchAndFilterItems } from 'lib/utils/search-items';

import { useChainId, useAccount } from './ready';

const useKnownTokens = (chainId: string, account: string, fungible = true, onlyDisplayed = true) => {
  const swrResponse = useRetryableSWR(
    ['use-known-tokens', chainId, account, onlyDisplayed],
    () => getStoredTokens(chainId, account, onlyDisplayed),
    {
      revalidateOnMount: true,
      refreshInterval: TOKENS_SYNC_INTERVAL
    }
  );

  const tokensMetadata = useTokensMetadataSelector();

  const tokens = swrResponse.data;

  const data = useMemo(
    () =>
      tokens?.filter(token => {
        const metadata = tokensMetadata[token.tokenSlug];
        if (!isDefined(metadata)) return false;

        const itIsCollectible = isCollectible(metadata);

        return fungible ? !itIsCollectible : itIsCollectible;
      }) ?? [],
    [tokens, tokensMetadata, fungible]
  );

  return {
    ...swrResponse,
    data
  };
};

export const useDisplayedFungibleTokens = (chainId: string, account: string) =>
  useKnownTokens(chainId, account, true, true);

const useFungibleTokens = (chainId: string, account: string) => useKnownTokens(chainId, account, true, false);

export const useCollectibleTokens = (chainId: string, account: string, onlyDisplayed: boolean = false) =>
  useKnownTokens(chainId, account, false, onlyDisplayed);

export const useAllStoredTokensSlugs = (chainId: string) =>
  useRetryableSWR(['use-tokens-slugs', chainId], () => getAllStoredTokensSlugs(chainId), {
    revalidateOnMount: true,
    refreshInterval: TOKENS_SYNC_INTERVAL
  });

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

export const useAvailableAssetsSlugs = (assetType: AssetTypesEnum) => {
  const chainId = useChainId(true)!;
  const { publicKeyHash } = useAccount();
  const allTokensMetadata = useTokensMetadataSelector();

  const { data: allCollectiblesSlugs = [], isValidating: allKnownCollectiblesTokenSlugsLoading } =
    useAllKnownCollectibleTokenSlugs(chainId);

  const {
    data: collectibles = [],
    mutate: mutateCollectibles,
    isValidating: collectibleTokensLoading
  } = useCollectibleTokens(chainId, publicKeyHash, false);

  const { data: allTokenSlugs = [], isValidating: allKnownFungibleTokenSlugsLoading } =
    useAllKnownFungibleTokenSlugs(chainId);

  const {
    data: tokens = [],
    mutate: mutateTokens,
    isValidating: fungibleTokensLoading
  } = useFungibleTokens(chainId, publicKeyHash);

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
    () =>
      slugs.filter(slug => slug !== TEMPLE_TOKEN_SLUG && slug in allTokensMetadata && !assetsStatuses[slug]?.removed),
    [slugs, allTokensMetadata, assetsStatuses]
  );

  return { availableAssets, assetsStatuses, isLoading, mutate };
};

const useAllKnownFungibleTokenSlugs = (chainId: string) => useAllKnownTokensSlugs(chainId, true);

const useAllKnownCollectibleTokenSlugs = (chainId: string) => useAllKnownTokensSlugs(chainId, false);

const useAllKnownTokensSlugs = (chainId: string, fungible = true) => {
  const swrResponse = useAllStoredTokensSlugs(chainId);
  const tokensMetadata = useTokensMetadataSelector();

  const slugs = swrResponse.data;

  const data = useMemo(
    () =>
      slugs?.filter(slug => {
        const metadata = tokensMetadata[slug];
        if (!isDefined(metadata)) return false;

        const itIsCollectible = isCollectible(metadata);

        return fungible ? !itIsCollectible : itIsCollectible;
      }) ?? [],
    [slugs, tokensMetadata, fungible]
  );

  return {
    ...swrResponse,
    data
  };
};

export function useAssetsSortPredicate() {
  const balances = useBalancesWithDecimals();
  const usdToTokenRates = useUsdToTokenRates();

  return useCallback(
    (tokenASlug: string, tokenBSlug: string) => {
      const tokenABalance = balances[tokenASlug] ?? new BigNumber(0);
      const tokenBBalance = balances[tokenBSlug] ?? new BigNumber(0);
      const tokenAEquity = tokenABalance.multipliedBy(usdToTokenRates[tokenASlug] ?? 0);
      const tokenBEquity = tokenBBalance.multipliedBy(usdToTokenRates[tokenBSlug] ?? 0);

      if (tokenAEquity.isEqualTo(tokenBEquity)) {
        return tokenBBalance.comparedTo(tokenABalance);
      }

      return tokenBEquity.comparedTo(tokenAEquity);
    },
    [balances, usdToTokenRates]
  );
}

export function useFilteredAssetsSlugs(
  assetsSlugs: string[],
  filterZeroBalances = false,
  leadingAssets?: string[],
  leadingAssetsAreFilterable = true
) {
  const allTokensMetadata = useTokensMetadataWithPresenceCheck(assetsSlugs);

  assetsSlugs = useMemo(
    () => (leadingAssets?.length ? assetsSlugs.filter(slug => leadingAssets.includes(slug)) : assetsSlugs),
    [assetsSlugs, leadingAssets]
  );

  const balances = useAccountBalances();
  const isNonZeroBalance = useCallback(
    (slug: string) => {
      const balance = balances[slug];
      return isDefined(balance) && balance !== '0';
    },
    [balances]
  );

  const sourceArray = useMemo(
    () => (filterZeroBalances ? assetsSlugs.filter(isNonZeroBalance) : assetsSlugs),
    [filterZeroBalances, assetsSlugs, isNonZeroBalance]
  );

  const [searchValue, setSearchValue] = useState('');
  const [tokenId, setTokenId] = useState<number>();
  const [searchValueDebounced] = useDebounce(tokenId ? toTokenSlug(searchValue, tokenId) : searchValue, 300);

  const assetsSortPredicate = useAssetsSortPredicate();

  const searchedSlugs = useMemo(
    () =>
      searchAssetsWithNoMeta(searchValueDebounced, sourceArray, allTokensMetadata, slug => slug).sort(
        assetsSortPredicate
      ),
    [searchValueDebounced, sourceArray, allTokensMetadata, assetsSortPredicate]
  );

  const filteredAssets = useMemo(() => {
    if (!isDefined(leadingAssets) || !leadingAssets.length) return searchedSlugs;

    const filteredLeadingSlugs = leadingAssetsAreFilterable ? leadingAssets.filter(isNonZeroBalance) : leadingAssets;

    const searchedLeadingSlugs = searchAssetsWithNoMeta(
      searchValueDebounced,
      filteredLeadingSlugs,
      allTokensMetadata,
      slug => slug
    );

    return searchedLeadingSlugs.length ? searchedLeadingSlugs.concat(searchedSlugs) : searchedSlugs;
  }, [
    leadingAssets,
    leadingAssetsAreFilterable,
    isNonZeroBalance,
    searchedSlugs,
    searchValueDebounced,
    allTokensMetadata
  ]);

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

export const updateTokensSWR = async (mutate: ScopedMutator, chainId: string, account: string) => {
  await mutate(['use-known-tokens', chainId, account, true]);
  await mutate(['use-known-tokens', chainId, account, false]);
  await mutate(['use-tokens-slugs', chainId]);
};
