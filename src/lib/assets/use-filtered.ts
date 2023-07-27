import { useCallback, useMemo, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import { BigNumber } from 'bignumber.js';
import { useDebounce } from 'use-debounce';

import { useBalancesWithDecimals } from 'app/hooks/use-balances-with-decimals.hook';
import { toTokenSlug } from 'lib/assets';
import { useAccountBalances } from 'lib/balances';
import { useUsdToTokenRates } from 'lib/fiat-currency/core';
import { useTokensMetadataWithPresenceCheck } from 'lib/metadata';

import { searchAssetsWithNoMeta } from './search.utils';

export function useFilteredAssetsSlugs(
  assetsSlugs: string[],
  filterZeroBalances = false,
  leadingAssets?: string[],
  leadingAssetsAreFilterable = false
) {
  const allTokensMetadata = useTokensMetadataWithPresenceCheck(assetsSlugs);

  const nonLeadingAssets = useMemo(
    () => (leadingAssets?.length ? assetsSlugs.filter(slug => !leadingAssets.includes(slug)) : assetsSlugs),
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
    () => (filterZeroBalances ? nonLeadingAssets.filter(isNonZeroBalance) : nonLeadingAssets),
    [filterZeroBalances, nonLeadingAssets, isNonZeroBalance]
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

    const filteredLeadingSlugs =
      leadingAssetsAreFilterable && filterZeroBalances ? leadingAssets.filter(isNonZeroBalance) : leadingAssets;

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
    filterZeroBalances,
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
