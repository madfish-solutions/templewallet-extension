import { startTransition, useEffect, useState } from 'react';

import constate from 'constate';
import { useDebounce } from 'use-debounce';

import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useBooleanState } from 'lib/ui/hooks';
import { useLocation } from 'lib/woozie';

const useAssetsKindViewState = (shouldPersistStateFn: SyncFn<string, boolean>) => {
  const { filterChain } = useAssetsFilterOptionsSelector();
  const { pathname } = useLocation();
  const filterChainId = filterChain?.chainId;

  const [selectedChains, setSelectedChains] = useState<(number | string)[]>(() =>
    filterChainId ? [filterChainId] : []
  );

  const [customTokenModalOpened, openCustomTokenModal, closeCustomTokenModal] = useBooleanState(false);
  const [manageActive, setManageActive, setManageInactive, toggleManageActive] = useBooleanState(false);

  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const resetSearchValue = () => setSearchValue('');
  const resetSelectedChains = () => setSelectedChains(filterChainId ? [filterChainId] : []);

  useEffect(() => {
    if (!shouldPersistStateFn(pathname)) {
      startTransition(() => {
        setManageInactive();
        resetSearchValue();
        resetSelectedChains();
      });
    }
  }, [filterChainId, pathname, shouldPersistStateFn, setManageInactive, resetSearchValue, resetSelectedChains]);

  return {
    manageActive,
    setManageActive,
    setManageInactive,
    toggleManageActive,
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

const tokensPagesPaths = ['/tokens', '/token'];
const collectiblesPagesPaths = ['/nfts', '/collectible'];

// Moving this function into a separate constant seems to be the only way to make React Compiler work here
const useAssetsViewState = () => {
  const { filterChain } = useAssetsFilterOptionsSelector();

  const tokensViewState = useAssetsKindViewState(pathname => tokensPagesPaths.some(path => pathname.startsWith(path)));
  const collectiblesViewState = useAssetsKindViewState(pathname =>
    collectiblesPagesPaths.some(path => pathname.startsWith(path))
  );

  return { chainIsGloballySelected: Boolean(filterChain), tokensViewState, collectiblesViewState };
};

export const [
  AssetsViewStateProvider,
  useTokensManageState,
  useCollectiblesManageState,
  useTokensSearchState,
  useCollectiblesSearchState,
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
