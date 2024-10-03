import { useEffect } from 'react';

import { useUpdatableRef } from './useUpdatableRef';

const DEFAULT_DEPS: unknown[] = [];

export const useTimeout = (callback: EmptyFn, timeout: number, condition = true, deps = DEFAULT_DEPS) => {
  const callbackRef = useUpdatableRef(callback);

  useEffect(() => {
    if (!condition) return;

    const timeoutId = setTimeout(() => void callbackRef.current(), timeout);

    return () => void clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [condition, timeout, ...deps]);
};
