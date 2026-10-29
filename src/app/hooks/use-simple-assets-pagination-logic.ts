import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';

import { useLoadedItemsCount, useRememberLoadedItemsCount } from './use-loaded-items-count';
import { useSimplePaginationLogic } from './use-simple-pagination-logic';

const ITEMS_PER_PAGE = 30;

export const useSimpleAssetsPaginationLogic = (sortedSlugs: string[]) => {
  const { filterChain } = useAssetsFilterOptionsSelector();
  // restoring below one page would stick when the whole list fits in a page: the generic hook's top-up needs total > minimum
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
