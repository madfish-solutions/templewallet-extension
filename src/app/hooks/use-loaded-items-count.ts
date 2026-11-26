import { useEffect } from 'react';

import { useLocation } from 'lib/woozie';

const LOADED_COUNTS = new Map<string, number>();

export const useRestoredValue = <T>(values: Map<string, T>, key: string) => {
  const { trigger, href } = useLocation();

  return trigger === 'popstate' ? values.get(`${key}:${href}`) : undefined;
};

export const useRememberValue = <T>(values: Map<string, T>, key: string, value: T) =>
  useEffect(() => void values.set(`${key}:${window.location.href}`, value), [values, key, value]);

export const useLoadedItemsCount = (listKind: string) => useRestoredValue(LOADED_COUNTS, listKind);

export const useRememberLoadedItemsCount = (listKind: string, count: number) =>
  useRememberValue(LOADED_COUNTS, listKind, count);
