import { useGenericPaginationLogic } from './use-generic-pagination-logic';

const simpleSlice = <T>(items: T[], end: number) => items.slice(0, end);
const simpleLength = <T>(items: T[]) => items.length;

export const useSimplePaginationLogic = <T>(
  items: T[],
  deps: unknown[] = [],
  minInitialItemsCount = 10,
  itemsPerPage = 30
) => useGenericPaginationLogic(items, deps, minInitialItemsCount, itemsPerPage, simpleSlice, simpleLength);
