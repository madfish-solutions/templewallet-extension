import { useMemo } from 'react';

import { useLocation } from 'lib/woozie';

import { EXTERNAL_AD_QUERY } from '../constants';

export const useTKeyAd = () => {
  const location = useLocation();

  return useMemo(() => {
    const usp = new URLSearchParams(location.search);

    const externalAd = usp.get(EXTERNAL_AD_QUERY);

    return externalAd === 'true';
  }, []);
};
