import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { ChainGroupedSlugs } from 'temple/front/chains';

import { useGroupPaginationLogic } from './use-group-pagination-logic';

export const useGroupedAssetsPaginationLogic = (sortedGroupedSlugs: ChainGroupedSlugs) => {
  const { filterChain } = useAssetsFilterOptionsSelector();
  const { paginatedItems: slugsGroups, loadNext } = useGroupPaginationLogic(sortedGroupedSlugs, [filterChain]);

  return { slugsGroups, loadNext };
};
