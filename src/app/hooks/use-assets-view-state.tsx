import { useCallback, useState } from 'react';

import constate from 'constate';
import { useDebounce } from 'use-debounce';

import { useBooleanState } from 'lib/ui/hooks';

export const [AssetsViewStateProvider, useManageState, useSearchState, useSearchModeState] = constate(
  () => {
    const [manageActive, setManageActive, setManageInactive] = useBooleanState(false);
    const [searchMode, setSearchModeActive, setSearchModeInactive] = useBooleanState(false);

    const [searchValue, setSearchValue] = useState('');
    const [searchValueDebounced] = useDebounce(searchValue, 300);

    const resetSearchValue = useCallback(() => setSearchValue(''), []);

    return {
      manageActive,
      setManageActive,
      setManageInactive,
      searchMode,
      setSearchModeActive,
      setSearchModeInactive,
      searchValue,
      searchValueDebounced,
      setSearchValue,
      resetSearchValue
    };
  },
  state => ({
    manageActive: state.manageActive,
    setManageActive: state.setManageActive,
    setManageInactive: state.setManageInactive
  }),
  state => ({
    searchValue: state.searchValue,
    searchValueDebounced: state.searchValueDebounced,
    setSearchValue: state.setSearchValue,
    resetSearchValue: state.resetSearchValue
  }),
  state => ({
    searchMode: state.searchMode,
    setSearchModeActive: state.setSearchModeActive,
    setSearchModeInactive: state.setSearchModeInactive
  })
);
