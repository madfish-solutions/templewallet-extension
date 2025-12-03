import { useState } from 'react';

import constate from 'constate';
import { useDebounce } from 'use-debounce';

import { useBooleanState } from 'lib/ui/hooks';

export const [AssetsViewStateProvider, useAssetsViewState] = constate(() => {
  const [manageActive, _, setManageInactive, toggleManageActive] = useBooleanState(false);

  const [filtersOpened, _2, setFiltersClosed, toggleFiltersOpened] = useBooleanState(false);

  const [searchMode, setSearchModeActive, setSearchModeInactive, toggleSearchMode] = useBooleanState(false);

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const resetSearchValue = () => setSearchValue('');

  return {
    manageActive,
    setManageInactive,
    toggleManageActive,
    filtersOpened,
    setFiltersClosed,
    toggleFiltersOpened,
    searchMode,
    setSearchModeActive,
    setSearchModeInactive,
    toggleSearchMode,
    searchValue,
    searchValueDebounced,
    setSearchValue,
    resetSearchValue
  };
});
