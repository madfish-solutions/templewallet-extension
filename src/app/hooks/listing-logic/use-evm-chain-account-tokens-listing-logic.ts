import { useCallback, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useRawEvmChainAccountBalancesSelector } from 'app/store/evm/balances/selectors';
import {
  useEvmChainBalancesLoadingSelector,
  useEvmTokensExchangeRatesLoading,
  useEvmTokensMetadataLoadingSelector
} from 'app/store/evm/selectors';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEvmChainAccountTokens } from 'lib/assets/hooks/tokens';
import { searchEvmChainTokensWithNoMeta } from 'lib/assets/search.utils';
import { useEvmChainTokensSortPredicate } from 'lib/assets/use-sorting';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useEvmChainByChainId } from 'temple/front/chains';

import { useSimpleAssetsPaginationLogic } from '../use-simple-assets-pagination-logic';

import { useCommonAssetsListingLogic } from './utils';

export const useEvmChainAccountTokensForListing = (
  publicKeyHash: HexString,
  chainId: number,
  filterZeroBalances: boolean
) => {
  const tokensSortPredicate = useEvmChainTokensSortPredicate(publicKeyHash, chainId);

  const tokens = useEvmChainAccountTokens(publicKeyHash, chainId);

  const balances = useRawEvmChainAccountBalancesSelector(publicKeyHash, chainId);

  const isNonZeroBalance = useCallback(
    (slug: string) => {
      const balance = balances[slug];

      return isDefined(balance) && balance !== '0';
    },
    [balances]
  );

  const enabledSlugsFiltered = useMemo(() => {
    const gasTokensSlugs: string[] = [EVM_TOKEN_SLUG];
    const enabledSlugs = gasTokensSlugs.concat(
      tokens.filter(({ status }) => status === 'enabled').map(({ slug }) => slug)
    );

    return filterZeroBalances ? enabledSlugs.filter(isNonZeroBalance) : enabledSlugs;
  }, [filterZeroBalances, isNonZeroBalance, tokens]);

  const enabledSlugsSorted = useMemoWithCompare(
    () => enabledSlugsFiltered.sort(tokensSortPredicate),
    [enabledSlugsFiltered, tokensSortPredicate]
  );

  return {
    enabledSlugsSorted,
    tokens,
    tokensSortPredicate
  };
};

export const useEvmChainAccountTokensListingLogic = (allSlugsSorted: string[], chainId: number) => {
  const { slugs: paginatedSlugs, loadNext } = useSimpleAssetsPaginationLogic(allSlugsSorted);

  const balancesLoading = useEvmChainBalancesLoadingSelector(chainId);
  const isMetadataLoading = useEvmTokensMetadataLoadingSelector();
  const exchangeRatesLoading = useEvmTokensExchangeRatesLoading();

  const { searchValue, searchValueDebounced, setSearchValue, isInSearchMode, isSyncing } = useCommonAssetsListingLogic(
    balancesLoading || isMetadataLoading || exchangeRatesLoading
  );

  const chain = useEvmChainByChainId(chainId);
  const metadata = useEvmTokensMetadataRecordSelector();

  const getMetadata = useCallback(
    (slug: string) => {
      if (slug === EVM_TOKEN_SLUG) return chain?.currency;

      return metadata[chainId]?.[slug];
    },
    [chain, metadata, chainId]
  );

  const displayedSlugs = useMemo(
    () =>
      isInSearchMode
        ? searchEvmChainTokensWithNoMeta(searchValueDebounced, allSlugsSorted, getMetadata, slug => slug)
        : paginatedSlugs,
    [paginatedSlugs, allSlugsSorted, isInSearchMode, getMetadata, searchValueDebounced]
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
