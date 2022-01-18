import { RoutePairWithDirection } from '../interface/route-pair-with-direction.interface';

const findRoutes = (
  inputAssetSlug: string,
  outputAssetSlug: string,
  possiblePairs: RoutePairWithDirection[],
  maxDepth: number,
  // used in recursion.
  currentRoute: RoutePairWithDirection[] = [],
  allRoutes: Array<RoutePairWithDirection[]> = []
) => {
  for (let i = 0; i < possiblePairs.length; i++) {
    const pair = possiblePairs[i];
    if (pair.aTokenSlug !== inputAssetSlug) {
      continue;
    }

    // we have arrived at the output token, so this is the final trade of one of the paths
    if (maxDepth === 1 && pair.bTokenSlug === outputAssetSlug) {
      allRoutes.push([...currentRoute, pair]);
    } else if (maxDepth > 1 && possiblePairs.length > 1) {
      const pairsExcludingThisPair = possiblePairs.slice(0, i).concat(possiblePairs.slice(i + 1, possiblePairs.length));

      // otherwise, consider all the other paths that lead from this token as long as we have not exceeded maxHops
      findRoutes(
        pair.bTokenSlug,
        outputAssetSlug,
        pairsExcludingThisPair,
        maxDepth - 1,
        [...currentRoute, pair],
        allRoutes
      );
    }
  }

  return allRoutes;
};

const MAX_TRADE_DEPTH = 3;

export const getRoutePairsCombinations = (
  inputAssetSlug: string | null | undefined,
  outputAssetSlug: string | null | undefined,
  routePairsWithDirection: RoutePairWithDirection[],
  maxDepth = MAX_TRADE_DEPTH
) => {
  if (inputAssetSlug && outputAssetSlug) {
    const allCombinations: Array<RoutePairWithDirection[]> = [];

    for (let depth = 1; depth <= maxDepth; depth++) {
      const specificDepthCombinations = findRoutes(inputAssetSlug, outputAssetSlug, routePairsWithDirection, depth);

      allCombinations.push(...specificDepthCombinations);
    }

    return allCombinations;
  }

  return [];
};
