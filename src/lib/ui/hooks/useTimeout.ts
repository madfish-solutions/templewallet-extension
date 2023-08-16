import { useEffect } from 'react';

import { USER_ACTION_TIMEOUT } from 'lib/fixed-times';

export const useTimeout = (condition: boolean, callback: EmptyFn, timeout = USER_ACTION_TIMEOUT) => {
  useEffect(() => {
    if (!condition) return;

    const timeoutId = setTimeout(callback, timeout);

    return () => void clearTimeout(timeoutId);
  }, [condition, timeout, callback]);
};
