import { useEffect } from 'react';

const DEFAULT_DEPS: unknown[] = [];

/**
 * @arg callback // Must be memoized
 */
export const useTimeout = (callback: EmptyFn, timeout: number, condition = true, deps = DEFAULT_DEPS) => {
  useEffect(() => {
    if (!condition) return;

    const timeoutId = setTimeout(callback, timeout);

    return () => void clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [condition, timeout, callback, ...deps]);
};
