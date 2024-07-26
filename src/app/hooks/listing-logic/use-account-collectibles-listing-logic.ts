import { useCallback, useMemo, useState } from 'react';

import { isEqual } from 'lodash';
import { useDebounce } from 'use-debounce';

import { useEvmCollectiblesMetadataRecordSelector } from 'app/store/evm/collectibles-metadata/selectors';
import { useEvmBalancesLoadingSelector, useEvmCollectiblesMetadataLoadingSelector } from 'app/store/evm/selectors';
import { useAreAssetsLoading } from 'app/store/tezos/assets/selectors';
import { useCollectiblesMetadataLoadingSelector } from 'app/store/tezos/collectibles-metadata/selectors';
import {
  useAllAccountChainCollectiblesSlugs,
  useEnabledAccountChainCollectiblesSlugs
} from 'lib/assets/hooks/collectibles';
import { searchAssetsWithNoMeta } from 'lib/assets/search.utils';
import { useAccountCollectiblesSortPredicate } from 'lib/assets/use-sorting';
import { useGetCollectibleMetadata } from 'lib/metadata';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { isSearchStringApplicable } from 'lib/utils/search-items';

import { useSimpleAssetsPaginationLogic } from '../use-simple-assets-pagination-logic';

import { useManageableSlugs } from './use-manageable-slugs';
import { getSlugFromChainSlug } from './utils';

export const useAccountCollectiblesListingLogic = (
  accountTezAddress: string,
  accountEvmAddress: HexString,
  manageActive = false
) => {
  const sortPredicate = useAccountCollectiblesSortPredicate(accountTezAddress, accountEvmAddress);

  const enabledChainSlugs = useEnabledAccountChainCollectiblesSlugs(accountTezAddress, accountEvmAddress);
  const allChainSlugs = useAllAccountChainCollectiblesSlugs(accountTezAddress, accountEvmAddress);

  const evmMetadata = useEvmCollectiblesMetadataRecordSelector();

  const tezAssetsLoading = useAreAssetsLoading('collectibles');
  const tezMetadatasLoading = useCollectiblesMetadataLoadingSelector();

  const evmBalancesLoading = useEvmBalancesLoadingSelector();
  const evmMetadatasLoading = useEvmCollectiblesMetadataLoadingSelector();

  const isSyncing = tezAssetsLoading || tezMetadatasLoading || evmBalancesLoading || evmMetadatasLoading;

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 500);

  const isInSearchMode = isSearchStringApplicable(searchValueDebounced);

  const getTezMetadata = useGetCollectibleMetadata();

  const getEvmMetadata = useCallback((chainId: number, slug: string) => evmMetadata[chainId]?.[slug], [evmMetadata]);

  const search = useCallback(
    (slugs: string[]) =>
      searchAssetsWithNoMeta(
        searchValueDebounced,
        slugs,
        (_, slug) => getTezMetadata(slug),
        getEvmMetadata,
        slug => slug,
        getSlugFromChainSlug
      ),
    [getEvmMetadata, getTezMetadata, searchValueDebounced]
  );

  // shouldn't resort on balances change
  const enabledSlugsSorted = useMemo(() => [...enabledChainSlugs].sort(sortPredicate), [enabledChainSlugs]);

  const enabledSearchedSlugs = useMemo(
    () => (isInSearchMode ? search(enabledSlugsSorted) : enabledSlugsSorted),
    [isInSearchMode, search, enabledSlugsSorted]
  );

  const manageableChainSlugs = useManageableSlugs(
    manageActive,
    allChainSlugs,
    enabledSlugsSorted,
    enabledSearchedSlugs
  );

  const searchedManageableSlugs = useMemoWithCompare(
    () => (isInSearchMode ? search(manageableChainSlugs) : manageableChainSlugs),
    [isInSearchMode, search, manageableChainSlugs],
    isEqual
  );

  const { slugs: paginatedSlugs, loadNext } = useSimpleAssetsPaginationLogic(searchedManageableSlugs);

  return {
    isInSearchMode,
    paginatedSlugs,
    isSyncing,
    loadNext,
    searchValue,
    setSearchValue
  };
};
