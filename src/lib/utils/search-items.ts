import Fuse from 'fuse.js';

export const isSearchStringApplicable = (searchString: string) => Boolean(searchString.trim());

export function searchAndFilterItems<T, S>(
  items: T[],
  searchString: string,
  keys: Fuse.FuseOptionKey[],
  prepare?: null | ((item: T) => S),
  threshold = 0.1
) {
  if (!isSearchStringApplicable(searchString)) return [...items];

  const searchable = prepare ? items.map(prepare) : items;

  const fuse = new Fuse(searchable as unknown[], {
    keys,
    threshold
  });

  const result = fuse.search(searchString);

  return result.map(({ refIndex }) => items[refIndex]!);
}
