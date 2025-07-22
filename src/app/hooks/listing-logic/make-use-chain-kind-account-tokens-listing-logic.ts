import { useMemo } from 'react';

import { AccountToken } from 'lib/assets/hooks/tokens';
import { parseChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { AssetMetadataBase, EvmNativeTokenMetadata, EvmTokenMetadata } from 'lib/metadata/types';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { groupByToEntries } from 'lib/utils/group-by-to-entries';
import { ChainGroupedSlugs, ChainId, ChainOfKind, PublicKeyHash } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { useGroupedAssetsPaginationLogic } from '../use-group-assets-pagination-logic';
import { useSimpleAssetsPaginationLogic } from '../use-simple-assets-pagination-logic';

import { getSlugWithChainId, useCommonAssetsListingLogic } from './utils';

type GetMetadata<T extends TempleChainKind> = (
  chainId: ChainId<T>,
  slug: string
) => (T extends TempleChainKind.EVM ? EvmTokenMetadata | EvmNativeTokenMetadata : AssetMetadataBase) | undefined;

interface TokensForListingHookFactoryConfig<T extends TempleChainKind> {
  useAccountTokens: SyncFn<PublicKeyHash<T>, AccountToken[]>;
  useEnabledChains: SyncFn<void, ChainOfKind<T>[]>;
  useTokensSortPredicate: SyncFn<PublicKeyHash<T>, (a: string, b: string) => number>;
  useIsBigBalance: SyncFn<PublicKeyHash<T>, (chainSlug: string) => boolean>;
  chainKind: T;
  gasTokenSlug: string;
}

interface TokensListingLogicFactoryConfig<T extends TempleChainKind> {
  useBalancesAreLoading: SyncFn<void, boolean>;
  useIsMetadataLoading: SyncFn<void, boolean>;
  useExchangeRatesLoading: SyncFn<void, boolean>;
  useGetTokenOrGasMetadata: SyncFn<void, GetMetadata<T>>;
  searchTokensWithNoMeta: (
    searchValueDebounced: string,
    slugs: string[],
    getMetadata: GetMetadata<T>,
    getSlugWithChainId: (chainSlug: string) => { chainId: ChainId<T>; assetSlug: string }
  ) => string[];
}

export const makeUseChainKindAccountTokensForListing = <T extends TempleChainKind>({
  useAccountTokens,
  useEnabledChains,
  useTokensSortPredicate,
  useIsBigBalance,
  chainKind,
  gasTokenSlug
}: TokensForListingHookFactoryConfig<T>) => {
  const useChainKindAccountTokensForListing = (
    publicKeyHash: PublicKeyHash<T>,
    filterSmallBalances: boolean,
    groupingEnabled: boolean
  ) => {
    const tokens = useAccountTokens(publicKeyHash);
    const enabledChains = useEnabledChains();
    const tokensSortPredicate = useTokensSortPredicate(publicKeyHash);
    const isBigBalance = useIsBigBalance(publicKeyHash);

    const enabledSlugs = useMemo(() => {
      const gasSlugs = enabledChains.map(chain => toChainAssetSlug(chainKind, chain.chainId, gasTokenSlug));

      const enabledTokensSlugs = tokens
        .filter(({ status }) => status === 'enabled')
        .map(({ chainId, slug }) => toChainAssetSlug(chainKind, chainId, slug));

      return gasSlugs.concat(enabledTokensSlugs);
    }, [tokens, enabledChains]);
    const enabledChainSlugsSorted = useMemoWithCompare(() => {
      const enabledSlugsFiltered = filterSmallBalances ? enabledSlugs.filter(isBigBalance) : enabledSlugs;

      return enabledSlugsFiltered.sort(tokensSortPredicate);
    }, [enabledSlugs, isBigBalance, tokensSortPredicate, filterSmallBalances]);
    const enabledChainSlugsSortedGrouped = useMemoWithCompare(() => {
      if (!groupingEnabled) return null;

      return groupByToEntries(enabledChainSlugsSorted, slug => parseChainAssetSlug(slug, chainKind)[1]);
    }, [enabledChainSlugsSorted, groupingEnabled]);

    return {
      enabledChainSlugsSorted,
      enabledChainSlugsSortedGrouped,
      tokens,
      tokensSortPredicate
    };
  };

  return useChainKindAccountTokensForListing;
};

const fallbackAllSlugsSortedGrouped: never[] = [];

export const makeUseChainKindAccountTokensListingLogic = <T extends TempleChainKind>({
  useBalancesAreLoading,
  useIsMetadataLoading,
  useExchangeRatesLoading,
  useGetTokenOrGasMetadata,
  searchTokensWithNoMeta
}: TokensListingLogicFactoryConfig<T>) => {
  const useChainKindAccountTokensListingLogic = (
    allSlugsSorted: string[],
    allSlugsSortedGrouped: ChainGroupedSlugs<T> | null
  ) => {
    const { slugs: paginatedSlugs, loadNext: loadNextPlain } = useSimpleAssetsPaginationLogic(allSlugsSorted);
    const { slugsGroups: paginatedSlugsGroupsWithFallback, loadNext: loadNextGrouped } =
      useGroupedAssetsPaginationLogic(allSlugsSortedGrouped ?? fallbackAllSlugsSortedGrouped);
    const paginatedSlugsGroups = allSlugsSortedGrouped ? paginatedSlugsGroupsWithFallback : null;

    const balancesLoading = useBalancesAreLoading();
    const isMetadataLoading = useIsMetadataLoading();
    const exchangeRatesLoading = useExchangeRatesLoading();

    const { searchValue, searchValueDebounced, setSearchValue, isInSearchMode, isSyncing } =
      useCommonAssetsListingLogic(balancesLoading || isMetadataLoading || exchangeRatesLoading);
    const getMetadata = useGetTokenOrGasMetadata();

    const displayedSlugs = useMemo(
      () =>
        isInSearchMode
          ? searchTokensWithNoMeta(searchValueDebounced, allSlugsSorted, getMetadata, getSlugWithChainId)
          : paginatedSlugs,
      [isInSearchMode, paginatedSlugs, allSlugsSorted, searchValueDebounced, getMetadata]
    );
    const displayedGroupedSlugs = useMemo(
      () =>
        isInSearchMode
          ? allSlugsSortedGrouped
              ?.map(([chainId, slugs]): [ChainId<T>, string[]] => [
                chainId,
                searchTokensWithNoMeta(searchValueDebounced, slugs, getMetadata, getSlugWithChainId)
              ])
              .filter(([, slugs]) => slugs.length > 0) ?? null
          : paginatedSlugsGroups,
      [allSlugsSortedGrouped, getMetadata, isInSearchMode, paginatedSlugsGroups, searchValueDebounced]
    );

    return {
      isInSearchMode,
      displayedSlugs,
      displayedGroupedSlugs,
      isSyncing,
      loadNextGrouped,
      loadNextPlain,
      searchValue,
      setSearchValue
    };
  };

  return useChainKindAccountTokensListingLogic;
};
