import { getRoute3TokenBySlug } from 'lib/route3/utils/get-route3-token-by-slug';

import { useSelector } from '../index';

export const useRoute3TokensSelector = () => useSelector(state => state.route3.tokens);
export const useRoute3SwapParamsSelector = () => useSelector(state => state.route3.swapParams);
export const useRoute3TokenSelector = (slug: string) =>
  useSelector(state => getRoute3TokenBySlug(state.route3.tokens.data, slug));
export const useRoute3DexesSelector = () => useSelector(state => state.route3.dexes);
