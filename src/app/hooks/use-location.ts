import { useMemo } from 'react';

import { useLocation } from 'lib/woozie';

export const useLocationSearchParamValue = (name: string) => {
  const { search } = useLocation();

  return useMemo(() => {
    const usp = new URLSearchParams(search);
    return usp.get(name);
  }, [search, name]);
};
