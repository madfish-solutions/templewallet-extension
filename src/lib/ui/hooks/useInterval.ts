import { DependencyList, useEffect } from 'react';

import { useUpdatableRef } from './useUpdatableRef';

export const useInterval = (
  callback: EmptyFn,
  deps: DependencyList,
  refreshInterval: number,
  shouldCallImmediately = true
) => {
  const callbackRef = useUpdatableRef(callback);

  useEffect(() => {
    if (shouldCallImmediately) {
      callbackRef.current();
    }

    const interval = setInterval(() => void callbackRef.current(), refreshInterval);

    return () => clearInterval(interval);
  }, deps);
};
