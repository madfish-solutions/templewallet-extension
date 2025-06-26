export const groupByToEntries = <T, K extends string | number>(values: T[], keyFn: (value: T) => K): [K, T[]][] => {
  const map = new Map<K, T[]>();

  for (const value of values) {
    const key = keyFn(value);
    const group = map.get(key) ?? [];
    if (!map.has(key)) map.set(key, group);

    group.push(value);
  }

  return Array.from(map.entries());
};
