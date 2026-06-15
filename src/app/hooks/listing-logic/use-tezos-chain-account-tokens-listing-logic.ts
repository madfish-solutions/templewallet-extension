import { useMemo } from 'react';

import { useTokensListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { useTokensMetadataLoadingSelector } from 'app/store/tezos/tokens-metadata/selectors';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useTezosChainAccountTokens } from 'lib/assets/hooks/tokens';
import { searchTezosChainAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useTezosChainAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { useGetChainTokenOrGasMetadata } from 'lib/metadata';
import { useMemoWithCompare } from 'lib/ui/hooks';

import { useSimpleAssetsPaginationLogic } from '../use-simple-assets-pagination-logic';

import { useIsTezosChainBigBalance } from './use-is-big-balance';
import { useCommonAssetsListingLogic } from './utils';

export const useTezosChainAccountTokensForListing = (publicKeyHash: string, chainId: string) => {
  const { hideSmallBalance: filterSmallBalances } = useTokensListOptionsSelector();

  const tokensSortPredicate = useTezosChainAccountTokensSortPredicate(publicKeyHash, chainId);

  const tokens = useTezosChainAccountTokens(publicKeyHash, chainId);

  const isBigBalance = useIsTezosChainBigBalance(publicKeyHash, chainId);

  const tokensSlugs = useMemo(() => {
    const gasSlugs: string[] = [TEZ_TOKEN_SLUG];

    return gasSlugs.concat(tokens.filter(({ status }) => status === 'enabled').map(({ slug }) => slug));
  }, [tokens]);

  const enabledTokenSlugsSorted = useMemoWithCompare(() => {
    const nonLeadingTokensSlugsFiltered = filterSmallBalances ? tokensSlugs.filter(isBigBalance) : tokensSlugs;

    return Array.from(new Set(nonLeadingTokensSlugsFiltered)).sort(tokensSortPredicate);
  }, [filterSmallBalances, isBigBalance, tokensSlugs, tokensSortPredicate]);

  const unfilteredTokensCount = useMemo(() => Array.from(new Set(tokensSlugs)).length, [tokensSlugs]);

  return {
    shouldShowHiddenTokensHint:
      filterSmallBalances && unfilteredTokensCount > 0 && enabledTokenSlugsSorted.length === 0,
    enabledTokenSlugsSorted,
    tokens,
    tokensSortPredicate
  };
};

export const useTezosChainAccountTokensListingLogic = (
  allSlugsSorted: string[],
  chainId: string,
  ignoreSearch = false
) => {
  const { slugs: paginatedSlugs, loadNext } = useSimpleAssetsPaginationLogic(allSlugsSorted);

  const assetsAreLoading = useAreAssetsLoading('tokens');
  const metadatasLoading = useTokensMetadataLoadingSelector();

  const { searchValue, searchValueDebounced, setSearchValue, isInSearchMode, isSyncing } = useCommonAssetsListingLogic(
    assetsAreLoading || metadatasLoading
  );

  const getTokenMetadata = useGetChainTokenOrGasMetadata(chainId);

  const displayedSlugs = useMemoWithCompare(
    () =>
      isInSearchMode && !ignoreSearch
        ? searchTezosChainAssetsWithNoMeta(searchValueDebounced, allSlugsSorted, getTokenMetadata, slug => slug)
        : paginatedSlugs,
    [isInSearchMode, paginatedSlugs, allSlugsSorted, getTokenMetadata, searchValueDebounced, ignoreSearch]
  );

  return {
    isInSearchMode,
    displayedSlugs,
    isSyncing,
    loadNext,
    searchValue,
    setSearchValue
  };
};
