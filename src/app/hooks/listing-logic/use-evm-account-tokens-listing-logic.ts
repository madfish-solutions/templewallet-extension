import { useCallback, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useRawEvmAccountBalancesSelector } from 'app/store/evm/balances/selectors';
import { useEvmTokensExchangeRatesLoading, useEvmTokensMetadataLoadingSelector } from 'app/store/evm/selectors';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEvmAccountTokens } from 'lib/assets/hooks/tokens';
import { searchEvmTokensWithNoMeta } from 'lib/assets/search.utils';
import { useEvmAccountTokensSortPredicate } from 'lib/assets/use-sorting';
import { fromChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useAllEvmChains, useEnabledEvmChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { useSimpleAssetsPaginationLogic } from '../use-simple-assets-pagination-logic';

import { useEvmBalancesAreLoading } from './use-evm-balances-loading-state';
import { getSlugWithChainId, useCommonAssetsListingLogic } from './utils';

export const useEvmAccountTokensForListing = (publicKeyHash: HexString, filterZeroBalances: boolean) => {
  const tokens = useEvmAccountTokens(publicKeyHash);

  const enabledChains = useEnabledEvmChains();

  const tokensSortPredicate = useEvmAccountTokensSortPredicate(publicKeyHash);

  const balances = useRawEvmAccountBalancesSelector(publicKeyHash);

  const isNonZeroBalance = useCallback(
    (chainSlug: string) => {
      const [_, chainId, slug] = fromChainAssetSlug<number>(chainSlug);

      const balance = balances[chainId]?.[slug];
      return isDefined(balance) && balance !== '0';
    },
    [balances]
  );

  const enabledSlugs = useMemo(() => {
    const gasSlugs = enabledChains.map(chain => toChainAssetSlug(TempleChainKind.EVM, chain.chainId, EVM_TOKEN_SLUG));

    const enabledTokensSlugs = tokens
      .filter(({ status }) => status === 'enabled')
      .map(({ chainId, slug }) => toChainAssetSlug(TempleChainKind.EVM, chainId, slug));

    return gasSlugs.concat(enabledTokensSlugs);
  }, [tokens, enabledChains]);

  const enabledChainSlugsSorted = useMemoWithCompare(() => {
    const enabledSlugsFiltered = filterZeroBalances ? enabledSlugs.filter(isNonZeroBalance) : enabledSlugs;

    return enabledSlugsFiltered.sort(tokensSortPredicate);
  }, [enabledSlugs, isNonZeroBalance, tokensSortPredicate, filterZeroBalances]);

  return {
    enabledChainSlugsSorted,
    tokens,
    tokensSortPredicate
  };
};

export const useEvmAccountTokensListingLogic = (allSlugsSorted: string[]) => {
  const { slugs: paginatedSlugs, loadNext } = useSimpleAssetsPaginationLogic(allSlugsSorted);

  const balancesLoading = useEvmBalancesAreLoading();
  const isMetadataLoading = useEvmTokensMetadataLoadingSelector();
  const exchangeRatesLoading = useEvmTokensExchangeRatesLoading();

  const { searchValue, searchValueDebounced, setSearchValue, isInSearchMode, isSyncing } = useCommonAssetsListingLogic(
    balancesLoading || isMetadataLoading || exchangeRatesLoading
  );

  const allEvmChains = useAllEvmChains();
  const metadata = useEvmTokensMetadataRecordSelector();

  const getMetadata = useCallback(
    (chainId: number, slug: string) =>
      slug === EVM_TOKEN_SLUG ? allEvmChains[chainId]?.currency : metadata[chainId]?.[slug],
    [allEvmChains, metadata]
  );

  const displayedSlugs = useMemo(
    () =>
      isInSearchMode
        ? searchEvmTokensWithNoMeta(searchValueDebounced, allSlugsSorted, getMetadata, getSlugWithChainId)
        : paginatedSlugs,
    [isInSearchMode, paginatedSlugs, allSlugsSorted, searchValueDebounced, getMetadata]
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
