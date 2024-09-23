import { useCallback, useMemo } from 'react';

import { HistoryAction, navigate, useLocation } from 'lib/woozie';

export const useSearchParamsBoolean = (paramName: string) => {
  const { search, pathname } = useLocation();
  const value = useMemo(() => {
    const usp = new URLSearchParams(search);

    return Boolean(usp.get(paramName));
  }, [paramName, search]);
  const setValue = useCallback(
    (newState: boolean) => {
      const newUsp = new URLSearchParams(search);
      if (newState) {
        newUsp.set(paramName, 'true');
      } else {
        newUsp.delete(paramName);
      }

      navigate({ search: newUsp.toString(), pathname }, HistoryAction.Replace);
    },
    [search, pathname, paramName]
  );
  const setTrue = useCallback(() => setValue(true), [setValue]);
  const setFalse = useCallback(() => setValue(false), [setValue]);

  return { value, setTrue, setFalse };
};
