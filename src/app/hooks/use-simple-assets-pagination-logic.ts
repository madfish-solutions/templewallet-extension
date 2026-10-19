import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';

import { useLoadedItemsCount, useRememberLoadedItemsCount } from './use-loaded-items-count';
import { useSimplePaginationLogic } from './use-simple-pagination-logic';

const ITEMS_PER_PAGE = 30;

export const useSimpleAssetsPaginationLogic = (sortedSlugs: string[]) => {
  const { filterChain } = useAssetsFilterOptionsSelector();
  // a remembered count below one page would stick: the generic hook tops up only when the total exceeds the minimum
  const rememberedCount = useLoadedItemsCount('plain') ?? 0;
  const { paginatedItems: slugs, loadNext } = useSimplePaginationLogic(
    sortedSlugs,
    [filterChain],
    ITEMS_PER_PAGE,
    ITEMS_PER_PAGE,
    Math.max(rememberedCount, ITEMS_PER_PAGE)
  );

  useRememberLoadedItemsCount('plain', slugs.length);

  return { slugs, loadNext };
};
