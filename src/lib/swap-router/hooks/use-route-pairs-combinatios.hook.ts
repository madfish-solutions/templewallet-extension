import { useMemo } from 'react';

import { RoutePair } from '../interface/route-pair.interface';
import { getAllowedRoutePairs } from '../utils/allowed-route-pairs.utils';
import { getRoutePairsCombinations } from '../utils/route-pairs-combinatios.utils';
import { getRoutePairsWithDirection } from '../utils/route-pairs-with-direction.utils';

export const useRoutePairsCombinations = (
  inputAssetSlug: string | null | undefined,
  outputAssetSlug: string | null | undefined,
  allRoutePairs: RoutePair[]
) =>
  useMemo(() => {
    const allowedRoutePairs = getAllowedRoutePairs(inputAssetSlug, outputAssetSlug, allRoutePairs);

    const allowedRoutePairsWithDirection = getRoutePairsWithDirection(allowedRoutePairs);

    return getRoutePairsCombinations(inputAssetSlug, outputAssetSlug, allowedRoutePairsWithDirection);
  }, [inputAssetSlug, outputAssetSlug, allRoutePairs]);
