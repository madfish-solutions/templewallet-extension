import { useEffect } from 'react';

import { useLocation } from 'lib/woozie';

const LOADED_COUNTS = new Map<string, number>();

/** How many items the list had when the user left this URL; a list remounted by back navigation starts at that length. */
export const useLoadedItemsCount = (listKind: string) => {
  const { trigger, href } = useLocation();

  return trigger === 'popstate' ? LOADED_COUNTS.get(`${listKind}:${href}`) : undefined;
};

export const useRememberLoadedItemsCount = (listKind: string, count: number) =>
  useEffect(() => void LOADED_COUNTS.set(`${listKind}:${window.location.href}`, count), [listKind, count]);
