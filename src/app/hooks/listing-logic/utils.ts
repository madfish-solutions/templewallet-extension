import { useState } from 'react';

import { useDebounce } from 'use-debounce';

import { fromChainAssetSlug } from 'lib/assets/utils';
import { isSearchStringApplicable } from 'lib/utils/search-items';

export const getSlugWithChainId = <T>(chainSlug: string) => {
  const [_, chainId, assetSlug] = fromChainAssetSlug<T>(chainSlug);

  return { chainId, assetSlug };
};

export const getSlugFromChainSlug = (chainSlug: string) => getSlugWithChainId(chainSlug).assetSlug;

export const useCommonAssetsListingLogic = (isSyncing: boolean | ((isInSearchMode: boolean) => boolean)) => {
  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const isInSearchMode = isSearchStringApplicable(searchValueDebounced);

  const isSyncingLocal: boolean = typeof isSyncing === 'function' ? isSyncing(isInSearchMode) : isSyncing;

  // In `isInSearchMode === false` there might be a glitch after `assetsAreLoading` & before `pageIsLoading`
  // of `isSyncing === false`. Debouncing to preserve `true` for a while.
  const [isSyncingDebounced] = useDebounce(isSyncingLocal, 500);

  return {
    searchValue,
    searchValueDebounced,
    setSearchValue,
    isInSearchMode,
    isSyncing: isSyncingLocal || isSyncingDebounced
  };
};
