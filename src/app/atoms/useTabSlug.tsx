import { useMemo } from 'react';

import { useLocation } from 'lib/woozie';

export const useTabSlug = () => {
  const { search } = useLocation();
  const tabSlug = useMemo(() => {
    const usp = new URLSearchParams(search);
    return usp.get('tab');
  }, [search]);
  return useMemo(() => tabSlug, [tabSlug]);
};
