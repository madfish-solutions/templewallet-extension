import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { ChainGroupedSlugs } from 'temple/front/chains';

import { totalGroupsLength, useGroupPaginationLogic } from './use-group-pagination-logic';
import { useLoadedItemsCount, useRememberLoadedItemsCount } from './use-loaded-items-count';

export const useGroupedAssetsPaginationLogic = (sortedGroupedSlugs: ChainGroupedSlugs) => {
  const { filterChain } = useAssetsFilterOptionsSelector();
  const initialItemsCount = useLoadedItemsCount('grouped');
  const { paginatedItems: slugsGroups, loadNext } = useGroupPaginationLogic(
    sortedGroupedSlugs,
    [filterChain],
    undefined,
    undefined,
    initialItemsCount
  );

  useRememberLoadedItemsCount('grouped', totalGroupsLength(slugsGroups));

  return { slugsGroups, loadNext };
};
