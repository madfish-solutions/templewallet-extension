import { useEffect, useMemo, useState } from 'react';

import { getAllRoutePairs } from '../backend';
import { RoutePair } from '../backend/interfaces/route-pair.interface';
import { getAllowedRoutePairs } from '../utils/allowed-route-pairs.utils';
import { getRoutePairsCombinations } from '../utils/route-pairs-combinatios.utils';
import { getRoutePairsWithDirection } from '../utils/route-pairs-with-direction.utils';

export const useRoutePairsCombinations = (
  inputAssetSlug: string | null | undefined,
  outputAssetSlug: string | null | undefined
) => {
  const [allRoutePairs, setAllRoutePairs] = useState<RoutePair[]>([]);

  useEffect(() => {
    (async () => {
      // TODO: add !0 pool check
      const allPairs = await getAllRoutePairs();
      setAllRoutePairs(allPairs);
      console.log('all', allPairs.length);
    })();
  }, []);

  return useMemo(() => {
    const allowedRoutePairs = getAllowedRoutePairs(inputAssetSlug, outputAssetSlug, allRoutePairs);

    const allowedRoutePairsWithDirection = getRoutePairsWithDirection(allowedRoutePairs);

    return getRoutePairsCombinations(inputAssetSlug, outputAssetSlug, allowedRoutePairsWithDirection);
  }, [inputAssetSlug, outputAssetSlug, allRoutePairs]);
};
