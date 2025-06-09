import { useCallback, useMemo } from 'react';

import { HistoryAction, navigate, useLocation } from 'lib/woozie';

export const useLocationSearchParamValue = (name: string) => {
  const { search, pathname, hash, state } = useLocation();

  const value = useMemo(() => {
    const usp = new URLSearchParams(search);
    return usp.get(name);
  }, [search, name]);
  const setValue = useCallback(
    (newValue: string | null) => {
      const newUsp = new URLSearchParams(search);
      if (newValue === null) {
        newUsp.delete(name);
      } else {
        newUsp.set(name, newValue);
      }
      navigate({ pathname, hash, state, search: newUsp.toString() }, HistoryAction.Replace);
    },
    [search, pathname, hash, state, name]
  );

  return [value, setValue] as const;
};
