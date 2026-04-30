import { useState } from 'react';

import constate from 'constate';
import { useDebounce } from 'use-debounce';

import { useLocationSearchParamValue } from 'app/hooks/use-location';
import { useBooleanState } from 'lib/ui/hooks';

type AssetsTab = 'tokens' | 'collectibles';

export const [
  AssetsViewStateProvider,
  useTokensManageState,
  useCollectiblesManageState,
  useActiveTabState,
  useSearchState,
  useSearchModeState
] = constate(
  () => {
    const [tabSlug, setTabSlug] = useLocationSearchParamValue('tab');

    const [tokensManageActive, setTokensManageActive, setTokensManageInactive] = useBooleanState(false);
    const [collectiblesManageActive, setCollectiblesManageActive, setCollectiblesManageInactive] =
      useBooleanState(false);
    const [searchMode, setSearchModeActive, setSearchModeInactive] = useBooleanState(false);

    const [searchValue, setSearchValue] = useState('');
    const [searchValueDebounced] = useDebounce(searchValue, 300);

    const activeTab: AssetsTab = tabSlug === 'collectibles' ? 'collectibles' : 'tokens';

    const resetSearchValue = () => setSearchValue('');
    const setActiveTab = (tab: AssetsTab) => setTabSlug(tab);

    return {
      activeTab,
      setActiveTab,
      tokensManageActive,
      setTokensManageActive,
      setTokensManageInactive,
      collectiblesManageActive,
      setCollectiblesManageActive,
      setCollectiblesManageInactive,
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
    manageActive: state.tokensManageActive,
    setManageActive: state.setTokensManageActive,
    setManageInactive: state.setTokensManageInactive
  }),
  state => ({
    manageActive: state.collectiblesManageActive,
    setManageActive: state.setCollectiblesManageActive,
    setManageInactive: state.setCollectiblesManageInactive
  }),
  state => ({
    activeTab: state.activeTab,
    setActiveTab: state.setActiveTab
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
