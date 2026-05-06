import { useCallback, useState } from 'react';

import constate from 'constate';
import { useDebounce } from 'use-debounce';

import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useBooleanState } from 'lib/ui/hooks';

export const [NftsViewStateProvider, useManageState, useSearchState, useSelectedChainsState] = constate(
  () => {
    const [manageActive, , , toggleManageActive] = useBooleanState(false);
    const { filterChain } = useAssetsFilterOptionsSelector();
    const [selectedChains, setSelectedChains] = useState<(number | string)[]>(filterChain ? [filterChain.chainId] : []);

    const [searchValue, setSearchValue] = useState('');
    const [searchValueDebounced] = useDebounce(searchValue, 300);

    const resetSearchValue = useCallback(() => setSearchValue(''), []);

    return {
      manageActive,
      toggleManageActive,
      searchValue,
      searchValueDebounced,
      setSearchValue,
      resetSearchValue,
      selectedChains,
      setSelectedChains,
      chainIsGloballySelected: Boolean(filterChain)
    };
  },
  state => ({
    manageActive: state.manageActive,
    toggleManageActive: state.toggleManageActive
  }),
  state => ({
    searchValue: state.searchValue,
    searchValueDebounced: state.searchValueDebounced,
    setSearchValue: state.setSearchValue,
    resetSearchValue: state.resetSearchValue
  }),
  state => ({
    selectedChains: state.selectedChains,
    setSelectedChains: state.setSelectedChains,
    chainIsGloballySelected: state.chainIsGloballySelected
  })
);
