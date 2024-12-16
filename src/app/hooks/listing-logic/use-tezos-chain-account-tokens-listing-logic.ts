import { useCallback, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useTokensListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { useAllAccountBalancesSelector } from 'app/store/tezos/balances/selectors';
import { useTokensMetadataLoadingSelector } from 'app/store/tezos/tokens-metadata/selectors';
import { TEMPLE_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets';
import { useTezosChainAccountTokens } from 'lib/assets/hooks/tokens';
import { searchTezosChainAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useTezosChainAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { useGetChainTokenOrGasMetadata } from 'lib/metadata';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useMemoWithCompare } from 'lib/ui/hooks';

import { useSimpleAssetsPaginationLogic } from '../use-simple-assets-pagination-logic';

import { useCommonAssetsListingLogic } from './utils';

export const useTezosChainAccountTokensForListing = (publicKeyHash: string, chainId: string) => {
  const { hideZeroBalance: filterZeroBalances } = useTokensListOptionsSelector();

  const leadingAssetsSlugs = useMemo(() => (chainId === TEZOS_MAINNET_CHAIN_ID ? [TEMPLE_TOKEN_SLUG] : []), [chainId]);

  const tokensSortPredicate = useTezosChainAccountTokensSortPredicate(publicKeyHash, chainId);

  const tokens = useTezosChainAccountTokens(publicKeyHash, chainId);

  const balances = useAllAccountBalancesSelector(publicKeyHash, chainId);

  const isNonZeroBalance = useCallback(
    (slug: string) => {
      const balance = balances[slug];
      return isDefined(balance) && balance !== '0';
    },
    [balances]
  );

  const leadingAssetsFiltered = useMemoWithCompare(
    () =>
      filterZeroBalances && leadingAssetsSlugs?.length
        ? leadingAssetsSlugs.filter(isNonZeroBalance)
        : leadingAssetsSlugs ?? [],
    [isNonZeroBalance, leadingAssetsSlugs, filterZeroBalances]
  );

  const nonLeadingTokensSlugsFiltered = useMemo(() => {
    const gasSlugs: string[] = [TEZ_TOKEN_SLUG];
    const nonLeadingSlugs = gasSlugs.concat(
      tokens.filter(({ status }) => status === 'enabled').map(({ slug }) => slug)
    );

    return filterZeroBalances ? nonLeadingSlugs.filter(isNonZeroBalance) : nonLeadingSlugs;
  }, [tokens, isNonZeroBalance, filterZeroBalances]);

  const nonLeadingTokenSlugsFilteredSorted = useMemoWithCompare(
    () => nonLeadingTokensSlugsFiltered.sort(tokensSortPredicate),
    [nonLeadingTokensSlugsFiltered, tokensSortPredicate]
  );

  const enabledTokenSlugsSorted = useMemo(
    () => Array.from(new Set(leadingAssetsFiltered.concat(nonLeadingTokenSlugsFilteredSorted))),
    [leadingAssetsFiltered, nonLeadingTokenSlugsFilteredSorted]
  );

  return {
    enabledTokenSlugsSorted,
    tokens,
    tokensSortPredicate
  };
};

export const useTezosChainAccountTokensListingLogic = (allSlugsSorted: string[], chainId: string) => {
  const { slugs: paginatedSlugs, loadNext } = useSimpleAssetsPaginationLogic(allSlugsSorted);

  const assetsAreLoading = useAreAssetsLoading('tokens');
  const metadatasLoading = useTokensMetadataLoadingSelector();

  const { searchValue, searchValueDebounced, setSearchValue, isInSearchMode, isSyncing } = useCommonAssetsListingLogic(
    assetsAreLoading || metadatasLoading
  );

  const getTokenMetadata = useGetChainTokenOrGasMetadata(chainId);

  const displayedSlugs = useMemoWithCompare(
    () =>
      isInSearchMode
        ? searchTezosChainAssetsWithNoMeta(searchValueDebounced, allSlugsSorted, getTokenMetadata, slug => slug)
        : paginatedSlugs,
    [isInSearchMode, paginatedSlugs, allSlugsSorted, getTokenMetadata, searchValueDebounced]
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
