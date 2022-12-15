import { DependencyList, useEffect } from 'react';

export const useInterval = (callback: EmptyFn, refreshInterval: number, deps: DependencyList) =>
  useEffect(() => {
    callback();

    const interval = setInterval(callback, refreshInterval);

    return () => clearInterval(interval);
  }, deps);
