import { useMemo } from 'react';

import { useLocation } from 'lib/woozie';

export const useTKeyAd = () => {
  const location = useLocation();

  return useMemo(() => {
    const usp = new URLSearchParams(location.search);

    const externalAd = usp.get('externalAd');

    return externalAd === 'true';
  }, []);
};
