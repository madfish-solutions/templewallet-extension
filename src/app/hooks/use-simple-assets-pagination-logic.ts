import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';

import { useSimplePaginationLogic } from './use-simple-pagination-logic';

export const useSimpleAssetsPaginationLogic = (sortedSlugs: string[]) => {
  const { filterChain } = useAssetsFilterOptionsSelector();
  const { paginatedItems: slugs, loadNext } = useSimplePaginationLogic(sortedSlugs, [filterChain]);

  return { slugs, loadNext };
};
