import { useEffect, useRef, useState } from 'react';

import { BigNumber } from 'bignumber.js';

import { RoutePair } from '../interface/route-pair.interface';

export const useAllRoutePairs = (webSocketUrl: string) => {
  const webSocketRef = useRef<WebSocket>();

  const [data, setData] = useState<RoutePair[]>([]);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    webSocketRef.current = new WebSocket(webSocketUrl);

    webSocketRef.current.onerror = (errorEvent: Event) => {
      console.log(errorEvent);
      setHasFailed(true);
    };

    webSocketRef.current.onmessage = (event: MessageEvent<string>) => {
      const rawAllPairs: RoutePair[] = JSON.parse(event.data);
      const allPairs = rawAllPairs.map<RoutePair>(rawPair => ({
        ...rawPair,
        aTokenPool: new BigNumber(rawPair.aTokenPool),
        bTokenPool: new BigNumber(rawPair.bTokenPool)
      }));

      const filteredPairs = allPairs.filter(pair => !pair.aTokenPool.isEqualTo(0) && !pair.bTokenPool.isEqualTo(0));

      setData(filteredPairs);
    };
    return () => webSocketRef.current?.close();
  }, [webSocketUrl]);

  return { data, hasFailed };
};
