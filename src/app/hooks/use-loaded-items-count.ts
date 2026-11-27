import { useEffect } from 'react';

import { useLocation } from 'lib/woozie';

const LOADED_COUNTS = new Map<string, number>();

export const useBackNavigationValue = <T>(values: Map<string, T>, key: string) => {
  const { trigger, href } = useLocation();

  return trigger === 'popstate' ? values.get(`${key}:${href}`) : undefined;
};

export const useRememberBackNavigationValue = <T>(values: Map<string, T>, key: string, value: T) =>
  useEffect(() => void values.set(`${key}:${window.location.href}`, value), [values, key, value]);

export const useForgetBackNavigationValueOnInPlaceUnmount = <T>(values: Map<string, T>, key: string) => {
  useEffect(() => {
    const valueKey = `${key}:${window.location.href}`;

    return () => {
      if (`${key}:${window.location.href}` === valueKey) values.delete(valueKey);
    };
  }, [values, key]);
};

export const useLoadedItemsCount = (listKind: string) => useBackNavigationValue(LOADED_COUNTS, listKind);

export const useRememberLoadedItemsCount = (listKind: string, count: number) =>
  useRememberBackNavigationValue(LOADED_COUNTS, listKind, count);
