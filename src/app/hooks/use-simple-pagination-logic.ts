import { useCallback, useState } from 'react';

import { useDidUpdate } from 'lib/ui/hooks';

export const useSimplePaginationLogic = <T>(
  items: T[],
  deps: unknown[] = [],
  minInitialItemsCount = 10,
  itemsPerPage = 30
) => {
  const [paginatedItems, setPaginatedItems] = useState<T[]>(() => items.slice(0, itemsPerPage));

  const _load = useCallback(
    (size: number) => {
      const nextItems = items.slice(0, size);

      setPaginatedItems(nextItems);
    },
    [items]
  );

  useDidUpdate(() => {
    if (paginatedItems.length < minInitialItemsCount) _load(itemsPerPage);
    else if (paginatedItems.length) _load(paginatedItems.length);
  }, [_load]);

  useDidUpdate(() => {
    _load(itemsPerPage);
  }, deps);

  const loadNext = useCallback(() => {
    if (paginatedItems.length === items.length) return;

    const size = (Math.floor(paginatedItems.length / itemsPerPage) + 1) * itemsPerPage;

    _load(size);
  }, [_load, paginatedItems.length, items.length]);

  return { paginatedItems, loadNext };
};
