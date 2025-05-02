import { useGenericPaginationLogic } from './use-generic-pagination-logic';

const groupSlice = <K, T>(items: [K, T[]][], end: number) => {
  const result: [K, T[]][] = [];

  let i = 0;
  let j = 0;

  while (i < end && j < items.length) {
    const [key, group] = items[j];

    if (i + group.length >= end) {
      const remaining = end - i;
      result.push([key, group.slice(0, remaining)]);
      break;
    } else {
      result.push([key, group]);
      i += group.length;
      j++;
    }
  }

  return result;
};
const totalGroupsLength = <K, T>(items: [K, T[]][]) => items.reduce((acc, [, group]) => acc + group.length, 0);

export const useGroupPaginationLogic = <K, T>(
  items: [K, T[]][],
  deps: unknown[] = [],
  minInitialItemsCount = 10,
  itemsPerPage = 30
) => useGenericPaginationLogic(items, deps, minInitialItemsCount, itemsPerPage, groupSlice, totalGroupsLength);
