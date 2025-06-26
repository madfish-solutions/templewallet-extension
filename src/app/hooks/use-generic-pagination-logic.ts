import { useCallback, useMemo, useState } from 'react';

import { useDidUpdate } from 'lib/ui/hooks';

export const useGenericPaginationLogic = <T extends unknown[]>(
  items: T,
  deps: unknown[] = [],
  minInitialItemsCount = 10,
  itemsPerPage = 30,
  slice: (items: T, end: number) => T,
  len: (items: T) => number
) => {
  const [paginatedItems, setPaginatedItems] = useState(() => slice(items, itemsPerPage));
  const paginatedItemsLength = useMemo(() => len(paginatedItems), [len, paginatedItems]);
  const itemsLength = useMemo(() => len(items), [len, items]);

  const _load = useCallback(
    (size: number) => {
      const nextItems = slice(items, size);

      setPaginatedItems(nextItems);
    },
    [items, slice]
  );

  useDidUpdate(() => {
    if (len(paginatedItems) < minInitialItemsCount) _load(itemsPerPage);
    else if (len(paginatedItems)) _load(len(paginatedItems));
  }, [_load]);

  useDidUpdate(() => {
    _load(itemsPerPage);
  }, deps);

  const loadNext = useCallback(() => {
    if (paginatedItemsLength === itemsLength) return;

    const size = (Math.floor(paginatedItemsLength / itemsPerPage) + 1) * itemsPerPage;

    _load(size);
  }, [_load, paginatedItemsLength, itemsLength]);

  return { paginatedItems, loadNext };
};
