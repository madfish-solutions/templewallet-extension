import Fuse from 'fuse.js';

export function searchAndFilterItems<T, S>(
  items: T[],
  searchString: string,
  keys: Fuse.FuseOptionKey[],
  prepare?: null | ((item: T) => S),
  threshold = 0.1
) {
  if (!searchString) return items;

  const searchable = prepare ? items.map(prepare) : items;

  const fuse = new Fuse(searchable as unknown[], {
    keys,
    threshold
  });

  const result = fuse.search(searchString);

  return items.filter((_, index) => result.some(({ refIndex }) => refIndex === index));
}
