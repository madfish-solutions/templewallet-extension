import constate from 'constate';

import { useBooleanState } from 'lib/ui/hooks';

export const [AssetsViewStateProvider, useAssetsViewState] = constate(() => {
  const [manageActive, _, setManageInactive, toggleManageActive] = useBooleanState(false);

  const [filtersOpened, _2, setFiltersClosed, toggleFiltersOpened] = useBooleanState(false);

  const [searchMode, setSearchModeActive, setSearchModeInactive, toggleSearchMode] = useBooleanState(false);

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
    toggleSearchMode
  };
});
