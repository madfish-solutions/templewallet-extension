import { useMemo } from 'react';

import { useLocation } from 'lib/woozie';

export const useTabSlug = () => {
  const { search } = useLocation();

  return useMemo(() => {
    const usp = new URLSearchParams(search);
    return usp.get('tab');
  }, [search]);
};
