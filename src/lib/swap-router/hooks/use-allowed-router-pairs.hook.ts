import { useEffect, useMemo, useState } from 'react';

import { getAllRoutePairs } from '../backend';
import { RoutePairInterface } from '../backend/interfaces/route-pair.interface';
import { ALLOWED_ROUTE_PAIRS_WHITELIST } from '../data/allowed-route-pairs.whitelist';

export const useAllowedRouterPairs = (
  inputAssetSlug: string | null | undefined,
  outputAssetSlug: string | null | undefined
) => {
  const [allRoutePairs, setAllRoutePairs] = useState<RoutePairInterface[]>([]);

  useEffect(() => {
    (async () => {
      const allPairs = await getAllRoutePairs();
      setAllRoutePairs(allPairs);
      console.log('all', allPairs.length);
    })();
  }, []);

  return useMemo(() => {
    if (inputAssetSlug && outputAssetSlug) {
      return allRoutePairs.filter(
        route =>
          ALLOWED_ROUTE_PAIRS_WHITELIST.includes(route.dexAddress) ||
          route.aTokenSlug === inputAssetSlug ||
          route.bTokenSlug === inputAssetSlug ||
          route.aTokenSlug === outputAssetSlug ||
          route.bTokenSlug === outputAssetSlug
      );
    }

    return [];
  }, [inputAssetSlug, outputAssetSlug, allRoutePairs]);
};
