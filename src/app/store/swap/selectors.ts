import { getRoute3TokenBySlug } from 'lib/route3/utils/get-route3-token-by-slug';

import { useSelector } from '../index';

export const useSwapParamsSelector = () => useSelector(state => state.swap.swapParams);
export const useSwapTokensSelector = () => useSelector(state => state.swap.tokens);
export const useSwapTokenSelector = (slug: string) =>
  useSelector(state => getRoute3TokenBySlug(state.swap.tokens.data, slug));
// TODO: use this selector to display a route
// ts-prune-ignore-next
export const useSwapDexesSelector = () => useSelector(state => state.swap.dexes);
