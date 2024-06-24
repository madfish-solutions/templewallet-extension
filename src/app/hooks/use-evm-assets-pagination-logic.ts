import { useCallback, useState } from 'react';

import { useDidUpdate } from 'lib/ui/hooks';

const ITEMS_PER_PAGE = 30;

export const useEvmAssetsPaginationLogic = (allSlugsSorted: string[], chainId: number) => {
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
  }, [allSlugsSorted, chainId]);

  const loadNext = useCallback(() => {
    if (slugs.length === allSlugsSorted.length) return;

    const size = (Math.floor(slugs.length / ITEMS_PER_PAGE) + 1) * ITEMS_PER_PAGE;

    _load(size);
  }, [_load, slugs.length, allSlugsSorted.length]);

  return { slugs, loadNext };
};
