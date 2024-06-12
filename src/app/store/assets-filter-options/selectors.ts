import { useSelector } from '../root-state.selector';

export const useTokensFilterOptionsSelector = () => useSelector(state => state.assetsFilterOptions.tokensOptions);
