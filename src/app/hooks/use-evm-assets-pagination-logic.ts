import { useCallback, useState } from 'react';

import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useDidUpdate } from 'lib/ui/hooks';

const ITEMS_PER_PAGE = 30;

export const useEvmAssetsPaginationLogic = (allSlugsSorted: string[]) => {
  const { filterChain } = useAssetsFilterOptionsSelector();

  const [slugs, setSlugs] = useState<string[]>(() => allSlugsSorted.slice(0, ITEMS_PER_PAGE));

  const _load = useCallback(
    async (size: number) => {
      const nextSlugs = allSlugsSorted.slice(0, size);

      setSlugs(nextSlugs);
    },
    [allSlugsSorted]
  );

  useDidUpdate(() => {
    _load(ITEMS_PER_PAGE);
  }, [allSlugsSorted, filterChain]);

  const loadNext = useCallback(() => {
    if (slugs.length === allSlugsSorted.length) return;

    const size = (Math.floor(slugs.length / ITEMS_PER_PAGE) + 1) * ITEMS_PER_PAGE;

    _load(size);
  }, [_load, slugs.length, allSlugsSorted.length]);

  return { slugs, loadNext };
};
