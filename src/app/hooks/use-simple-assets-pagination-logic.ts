import { useCallback, useState } from 'react';

import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useDidUpdate } from 'lib/ui/hooks';

const ITEMS_PER_PAGE = 30;
const MIN_INITIALLY_VISIBLE_ITEMS_COUNT = 8;

export const useSimpleAssetsPaginationLogic = (sortedSlugs: string[]) => {
  const { filterChain } = useAssetsFilterOptionsSelector();

  const [slugs, setSlugs] = useState<string[]>(() => sortedSlugs.slice(0, ITEMS_PER_PAGE));

  const _load = useCallback(
    async (size: number) => {
      const nextSlugs = sortedSlugs.slice(0, size);

      setSlugs(nextSlugs);
    },
    [sortedSlugs]
  );

  useDidUpdate(() => {
    if (slugs.length < MIN_INITIALLY_VISIBLE_ITEMS_COUNT) _load(ITEMS_PER_PAGE);
    else if (slugs.length) _load(slugs.length);
  }, [sortedSlugs]);

  useDidUpdate(() => {
    _load(ITEMS_PER_PAGE);
  }, [filterChain]);

  const loadNext = useCallback(() => {
    if (slugs.length === sortedSlugs.length) return;

    const size = (Math.floor(slugs.length / ITEMS_PER_PAGE) + 1) * ITEMS_PER_PAGE;

    _load(size);
  }, [_load, slugs.length, sortedSlugs.length]);

  return { slugs, loadNext };
};
