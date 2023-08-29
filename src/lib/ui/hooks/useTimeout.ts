import { useEffect } from 'react';

/**
 * @arg callback // Must be memoized
 */
export const useTimeout = (callback: EmptyFn, timeout: number, condition = true) => {
  useEffect(() => {
    if (!condition) return;

    const timeoutId = setTimeout(callback, timeout);

    return () => void clearTimeout(timeoutId);
  }, [condition, timeout, callback]);
};
