import { DependencyList, useEffect } from 'react';

import { useCallbackRef } from './useCallbackRef';

export const useInterval = (
  callback: EmptyFn,
  refreshInterval: number,
  deps: DependencyList,
  shouldCallImmediately = true
) => {
  const callbackRef = useCallbackRef(callback);

  useEffect(() => {
    if (shouldCallImmediately) {
      callbackRef.current();
    }

    const interval = setInterval(() => void callbackRef.current(), refreshInterval);

    return () => clearInterval(interval);
  }, deps);
};
