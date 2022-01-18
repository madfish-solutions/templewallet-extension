import { ALLOWED_ROUTE_PAIRS_WHITELIST } from '../data/allowed-route-pairs.whitelist';
import { RoutePair } from '../interface/route-pair.interface';

export const getAllowedRoutePairs = (
  inputAssetSlug: string | null | undefined,
  outputAssetSlug: string | null | undefined,
  allRoutePairs: RoutePair[]
) => {
  if (inputAssetSlug && outputAssetSlug) {
    return allRoutePairs.filter(
      route =>
        ALLOWED_ROUTE_PAIRS_WHITELIST.includes(route.dexAddress) ||
        (inputAssetSlug !== 'tez' && (route.aTokenSlug === inputAssetSlug || route.bTokenSlug === inputAssetSlug)) ||
        (outputAssetSlug !== 'tez' && (route.aTokenSlug === outputAssetSlug || route.bTokenSlug === outputAssetSlug))
    );
  }

  return [];
};
