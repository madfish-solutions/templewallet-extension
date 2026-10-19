import { useEffect } from 'react';

import { useLocation } from 'lib/woozie';

const LOADED_COUNTS = new Map<string, number>();

export const useLoadedItemsCount = (listKind: string) => {
  const { trigger, href } = useLocation();

  return trigger === 'popstate' ? LOADED_COUNTS.get(`${listKind}:${href}`) : undefined;
};

export const useRememberLoadedItemsCount = (listKind: string, count: number) =>
  useEffect(() => void LOADED_COUNTS.set(`${listKind}:${window.location.href}`, count), [listKind, count]);
