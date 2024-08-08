import { useSelector } from '../root-state.selector';

export const useAssetsFilterOptionsSelector = () => useSelector(state => state.assetsFilterOptions);

export const useTokensListOptionsSelector = () => useSelector(state => state.assetsFilterOptions.tokensListOptions);

export const useCollectiblesListOptionsSelector = () =>
  useSelector(state => state.assetsFilterOptions.collectiblesListOptions);
