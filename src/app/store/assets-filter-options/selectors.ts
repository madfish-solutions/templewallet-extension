import { useSelector } from '../root-state.selector';

export const useAssetsFilterOptionsSelector = () => useSelector(state => state.assetsFilterOptions);
