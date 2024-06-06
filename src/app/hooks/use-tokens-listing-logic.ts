import { useCallback, useMemo, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import { isEqual } from 'lodash';
import { useDebounce } from 'use-debounce';

import { useAllAccountBalancesSelector } from 'app/store/tezos/balances/selectors';
import { toTokenSlug } from 'lib/assets';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { searchAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useEvmTokensSortPredicate, useTezosTokensSortPredicate } from 'lib/assets/use-sorting';
import { useGetTokenOrGasMetadata } from 'lib/metadata';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { isSearchStringApplicable } from 'lib/utils/search-items';

export const useTezosTokensListingLogic = (
  tezosChainId: string,
  publicKeyHash: string,
  assetsSlugs: string[],
  filterZeroBalances = false,
  leadingAssets?: string[],
  leadingAssetsAreFilterable = false
) => {
  const nonLeadingAssets = useMemo(
    () => (leadingAssets?.length ? assetsSlugs.filter(slug => !leadingAssets.includes(slug)) : assetsSlugs),
    [assetsSlugs, leadingAssets]
  );

  const balances = useAllAccountBalancesSelector(publicKeyHash, tezosChainId);
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
  const [searchValueDebounced] = useDebounce(tokenId ? toTokenSlug(searchValue, String(tokenId)) : searchValue, 300);

  const assetsSortPredicate = useTezosTokensSortPredicate(publicKeyHash, tezosChainId);
  const getMetadata = useGetTokenOrGasMetadata(tezosChainId);

  const searchedSlugs = useMemo(
    () =>
      isSearchStringApplicable(searchValueDebounced)
        ? searchAssetsWithNoMeta(searchValueDebounced, sourceArray, getMetadata, slug => slug)
        : [...sourceArray].sort(assetsSortPredicate),
    [searchValueDebounced, sourceArray, getMetadata, assetsSortPredicate]
  );

  const filteredAssets = useMemoWithCompare(
    () => {
      if (!isDefined(leadingAssets) || !leadingAssets.length) return searchedSlugs;

      const filteredLeadingSlugs =
        leadingAssetsAreFilterable && filterZeroBalances ? leadingAssets.filter(isNonZeroBalance) : leadingAssets;

      const searchedLeadingSlugs = searchAssetsWithNoMeta(
        searchValueDebounced,
        filteredLeadingSlugs,
        getMetadata,
        slug => slug
      );

      return searchedLeadingSlugs.length ? searchedLeadingSlugs.concat(searchedSlugs) : searchedSlugs;
    },
    [
      leadingAssets,
      leadingAssetsAreFilterable,
      filterZeroBalances,
      isNonZeroBalance,
      searchedSlugs,
      searchValueDebounced,
      getMetadata
    ],
    isEqual
  );

  return {
    filteredAssets,
    searchValue,
    setSearchValue,
    tokenId,
    setTokenId
  };
};

export const useEvmTokensListingLogic = (publicKeyHash: HexString, chainId: number, assetsSlugs: string[]) => {
  const tokensSortPredicate = useEvmTokensSortPredicate(publicKeyHash, chainId);

  const sortedTokenSlugs = useMemoWithCompare(
    () => [EVM_TOKEN_SLUG, ...assetsSlugs.sort(tokensSortPredicate)],
    [assetsSlugs, tokensSortPredicate],
    isEqual
  );

  return {
    sortedTokenSlugs
  };
};
