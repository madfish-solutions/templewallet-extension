import Fuse from 'fuse.js';

export const isSearchStringApplicable = (searchString: string) => Boolean(searchString.trim());

export interface SearchKey<T, P extends null | ((item: T) => any)> {
  name: P extends (item: T) => infer S
    ? KeysOfUnionType<S> // Case of prepared objects
    : T extends object
    ? KeysOfUnionType<T> // Case of original objects
    : string; // Fallback
  weight: number;
}

export function searchAndFilterItems<T, P extends null | ((item: T) => any)>(
  items: T[],
  searchString: string,
  keys: SearchKey<T, P>[],
  prepare?: P,
  threshold = 0.1
) {
  if (!isSearchStringApplicable(searchString)) return [...items];

  const searchable = prepare ? items.map(prepare) : items;

  const fuse = new Fuse(searchable as unknown[], {
    keys: keys as Fuse.FuseOptionKey[],
    threshold
  });

  const result = fuse.search(searchString); // Goes in the order of relevance

  // Not using `{ item } => item`, since they are values of `searchable`, not `items`
  return result.map(({ refIndex }) => items[refIndex]!);
}

type KeysOfUnionType<T> = T extends infer U ? keyof U : never;
