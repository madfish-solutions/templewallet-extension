import { useCallback, useState } from 'react';

import constate from 'constate';
import { useDebounce } from 'use-debounce';

import { useBooleanState } from 'lib/ui/hooks';

export const [AssetsViewStateProvider, useAssetsViewState] = constate(() => {
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
});
