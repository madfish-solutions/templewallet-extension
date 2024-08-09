import { useCallback, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useRawEvmChainAccountBalancesSelector } from 'app/store/evm/balances/selectors';
import {
  useEvmChainBalancesLoadingSelector,
  useEvmTokensExchangeRatesLoadingSelector,
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

import { useManageableSlugs } from './use-manageable-slugs';
import { useCommonAssetsListingLogic } from './utils';

export const useEvmChainAccountTokensListingLogic = (
  publicKeyHash: HexString,
  chainId: number,
  filterZeroBalances = false,
  manageActive = false
) => {
  const tokensSortPredicate = useEvmChainTokensSortPredicate(publicKeyHash, chainId);

  const tokens = useEvmChainAccountTokens(publicKeyHash, chainId);

  const enabledStoredTokenSlugs = useMemo(
    () => tokens.filter(({ status }) => status === 'enabled').map(({ slug }) => slug),
    [tokens]
  );

  const allStoredTokenSlugs = useMemo(
    () => tokens.filter(({ status }) => status !== 'removed').map(({ slug }) => slug),
    [tokens]
  );

  const enabledTokenSlugs = useMemo(() => [EVM_TOKEN_SLUG, ...enabledStoredTokenSlugs], [enabledStoredTokenSlugs]);
  const allTokenSlugs = useMemo(() => [EVM_TOKEN_SLUG, ...allStoredTokenSlugs], [allStoredTokenSlugs]);

  const balances = useRawEvmChainAccountBalancesSelector(publicKeyHash, chainId);

  const balancesLoading = useEvmChainBalancesLoadingSelector(chainId);
  const isMetadataLoading = useEvmTokensMetadataLoadingSelector();
  const exchangeRatesLoading = useEvmTokensExchangeRatesLoadingSelector();

  const { searchValue, searchValueDebounced, setSearchValue, isInSearchMode, isSyncing } = useCommonAssetsListingLogic(
    balancesLoading || isMetadataLoading || exchangeRatesLoading
  );

  const chain = useEvmChainByChainId(chainId);
  const metadata = useEvmTokensMetadataRecordSelector();

  const isNonZeroBalance = useCallback(
    (slug: string) => {
      const balance = balances[slug];

      return isDefined(balance) && balance !== '0';
    },
    [balances]
  );

  const getMetadata = useCallback(
    (slug: string) => {
      if (slug === EVM_TOKEN_SLUG) return chain?.currency;

      return metadata[chainId]?.[slug];
    },
    [chain, metadata, chainId]
  );

  const search = useCallback(
    (slugs: string[]) => searchEvmChainTokensWithNoMeta(searchValueDebounced, slugs, getMetadata, slug => slug),
    [getMetadata, searchValueDebounced]
  );

  const filteredEnabledSlugs = useMemo(
    () => (filterZeroBalances ? enabledTokenSlugs.filter(isNonZeroBalance) : enabledTokenSlugs),
    [filterZeroBalances, enabledTokenSlugs, isNonZeroBalance]
  );

  const sortedEnabledSlugs = useMemo(
    () => [...filteredEnabledSlugs].sort(tokensSortPredicate),
    [filteredEnabledSlugs, tokensSortPredicate]
  );

  const searchedEnabledSlugs = useMemo(
    () => (isInSearchMode ? search(sortedEnabledSlugs) : sortedEnabledSlugs),
    [isInSearchMode, search, sortedEnabledSlugs]
  );

  const manageableSlugs = useManageableSlugs(manageActive, allTokenSlugs, sortedEnabledSlugs, searchedEnabledSlugs);

  const searchedManageableSlugs = useMemoWithCompare(
    () => (isInSearchMode ? search(manageableSlugs) : manageableSlugs),
    [isInSearchMode, search, manageableSlugs]
  );

  const { slugs: paginatedSlugs, loadNext } = useSimpleAssetsPaginationLogic(searchedManageableSlugs);

  return {
    paginatedSlugs,
    isSyncing,
    loadNext,
    searchValue,
    setSearchValue
  };
};
