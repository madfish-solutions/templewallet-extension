import { useEffect, useRef, useState } from 'react';

import constate from 'constate';
import { useDebounce } from 'use-debounce';

import { useLocationSearchParamValue } from 'app/hooks/use-location';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useBooleanState } from 'lib/ui/hooks';
import { useLocation } from 'lib/woozie';

type AssetsTab = 'tokens' | 'collectibles';

const useAssetsKindViewState = (shouldPersistStateFn: SyncFn<string, boolean>) => {
  const { filterChain } = useAssetsFilterOptionsSelector();
  const { pathname } = useLocation();
  const filterChainId = filterChain?.chainId;

  const [selectedChains, setSelectedChains] = useState<(number | string)[]>(() =>
    filterChainId ? [filterChainId] : []
  );

  const [customTokenModalOpened, openCustomTokenModal, closeCustomTokenModal] = useBooleanState(false);
  const [manageActive, setManageActive, setManageInactive, toggleManageActive] = useBooleanState(false);
  const [searchMode, setSearchModeActive, setSearchModeInactive] = useBooleanState(false);
  const prevShouldPersistStateRef = useRef(shouldPersistStateFn(pathname));

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const resetSearchValue = () => setSearchValue('');
  const resetSelectedChains = () => setSelectedChains(filterChainId ? [filterChainId] : []);

  useEffect(() => {
    const shouldPersistState = shouldPersistStateFn(pathname);

    if (!shouldPersistState && prevShouldPersistStateRef.current) {
      setManageInactive();
      setSearchModeInactive();
      resetSearchValue();
      resetSelectedChains();
    }

    prevShouldPersistStateRef.current = shouldPersistState;
  }, [pathname, shouldPersistStateFn, setManageInactive, setSearchModeInactive, resetSearchValue, resetSelectedChains]);

  return {
    manageActive,
    setManageActive,
    setManageInactive,
    toggleManageActive,
    searchMode,
    setSearchModeActive,
    setSearchModeInactive,
    searchValue,
    searchValueDebounced,
    setSearchValue,
    resetSearchValue,
    selectedChains,
    setSelectedChains,
    customTokenModalOpened,
    openCustomTokenModal,
    closeCustomTokenModal
  };
};

const collectiblesPagesPaths = ['/nfts', '/collectible'];

// Moving this function into a separate constant seems to be the only way to make React Compiler work here
const useAssetsViewState = () => {
  const [tabSlug, setTabSlug] = useLocationSearchParamValue('tab');
  const { filterChain } = useAssetsFilterOptionsSelector();

  const tokensViewState = useAssetsKindViewState(() => true);
  const collectiblesViewState = useAssetsKindViewState(pathname =>
    collectiblesPagesPaths.some(path => pathname.startsWith(path))
  );

  const activeTab: AssetsTab = tabSlug === 'collectibles' ? 'collectibles' : 'tokens';

  const setActiveTab = (tab: AssetsTab) => setTabSlug(tab);

  return {
    chainIsGloballySelected: Boolean(filterChain),
    activeTab,
    setActiveTab,
    tokensViewState,
    collectiblesViewState
  };
};

export const [
  AssetsViewStateProvider,
  useTokensManageState,
  useCollectiblesManageState,
  useActiveTabState,
  useTokensSearchState,
  useCollectiblesSearchState,
  useTokensSearchModeState,
  useCollectiblesSelectedChainsState,
  useTokensSelectedChainsState,
  useCollectiblesCustomTokenModalState
] = constate(
  useAssetsViewState,
  ({ tokensViewState }) => ({
    manageActive: tokensViewState.manageActive,
    setManageActive: tokensViewState.setManageActive,
    setManageInactive: tokensViewState.setManageInactive,
    toggleManageActive: tokensViewState.toggleManageActive
  }),
  ({ collectiblesViewState }) => ({
    manageActive: collectiblesViewState.manageActive,
    setManageActive: collectiblesViewState.setManageActive,
    setManageInactive: collectiblesViewState.setManageInactive,
    toggleManageActive: collectiblesViewState.toggleManageActive
  }),
  state => ({
    activeTab: state.activeTab,
    setActiveTab: state.setActiveTab
  }),
  ({ tokensViewState }) => ({
    searchValue: tokensViewState.searchValue,
    searchValueDebounced: tokensViewState.searchValueDebounced,
    setSearchValue: tokensViewState.setSearchValue,
    resetSearchValue: tokensViewState.resetSearchValue
  }),
  ({ collectiblesViewState }) => ({
    searchValue: collectiblesViewState.searchValue,
    searchValueDebounced: collectiblesViewState.searchValueDebounced,
    setSearchValue: collectiblesViewState.setSearchValue,
    resetSearchValue: collectiblesViewState.resetSearchValue
  }),
  ({ tokensViewState }) => ({
    searchMode: tokensViewState.searchMode,
    setSearchModeActive: tokensViewState.setSearchModeActive,
    setSearchModeInactive: tokensViewState.setSearchModeInactive
  }),
  ({ collectiblesViewState, chainIsGloballySelected }) => ({
    selectedChains: collectiblesViewState.selectedChains,
    setSelectedChains: collectiblesViewState.setSelectedChains,
    chainIsGloballySelected
  }),
  ({ tokensViewState, chainIsGloballySelected }) => ({
    selectedChains: tokensViewState.selectedChains,
    setSelectedChains: tokensViewState.setSelectedChains,
    chainIsGloballySelected
  }),
  ({ collectiblesViewState }) => ({
    customTokenModalOpened: collectiblesViewState.customTokenModalOpened,
    openCustomTokenModal: collectiblesViewState.openCustomTokenModal,
    closeCustomTokenModal: collectiblesViewState.closeCustomTokenModal
  })
);
