import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';

import { useLoadedItemsCount, useRememberLoadedItemsCount } from './use-loaded-items-count';
import { useSimplePaginationLogic } from './use-simple-pagination-logic';

export const useSimpleAssetsPaginationLogic = (sortedSlugs: string[]) => {
  const { filterChain } = useAssetsFilterOptionsSelector();
  const initialItemsCount = useLoadedItemsCount('plain');
  const { paginatedItems: slugs, loadNext } = useSimplePaginationLogic(
    sortedSlugs,
    [filterChain, sortedSlugs.length],
    undefined,
    undefined,
    initialItemsCount
  );

  useRememberLoadedItemsCount('plain', slugs.length);

  return { slugs, loadNext };
};
