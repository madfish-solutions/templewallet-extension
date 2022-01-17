import { useEffect, useMemo, useRef, useState } from 'react';

import { BigNumber } from 'bignumber.js';

import { TEZOS_DEXES_API_URL } from '../config';
import { RoutePair } from '../interface/route-pair.interface';
import { getAllowedRoutePairs } from '../utils/allowed-route-pairs.utils';
import { getRoutePairsCombinations } from '../utils/route-pairs-combinatios.utils';
import { getRoutePairsWithDirection } from '../utils/route-pairs-with-direction.utils';

export const useRoutePairsCombinations = (
  inputAssetSlug: string | null | undefined,
  outputAssetSlug: string | null | undefined
) => {
  const webSocketRef = useRef<WebSocket>();
  const [allRoutePairs, setAllRoutePairs] = useState<RoutePair[]>([]);

  useEffect(() => {
    webSocketRef.current = new WebSocket(TEZOS_DEXES_API_URL);

    webSocketRef.current.onmessage = (event: MessageEvent<string>) => {
      const rawAllPairs: RoutePair[] = JSON.parse(event.data);
      const allPairs = rawAllPairs.map<RoutePair>(rawPair => ({
        ...rawPair,
        aTokenPool: new BigNumber(rawPair.aTokenPool),
        bTokenPool: new BigNumber(rawPair.bTokenPool)
      }));

      const filteredPairs = allPairs.filter(pair => !pair.aTokenPool.isEqualTo(0) && !pair.bTokenPool.isEqualTo(0));

      setAllRoutePairs(filteredPairs);
    };
    return () => webSocketRef.current?.close();
  }, []);

  return useMemo(() => {
    const allowedRoutePairs = getAllowedRoutePairs(inputAssetSlug, outputAssetSlug, allRoutePairs);

    const allowedRoutePairsWithDirection = getRoutePairsWithDirection(allowedRoutePairs);

    return getRoutePairsCombinations(inputAssetSlug, outputAssetSlug, allowedRoutePairsWithDirection);
  }, [inputAssetSlug, outputAssetSlug, allRoutePairs]);
};
