import { useEffect } from 'react';

import { EMPTY_FROZEN_ARRAY } from 'lib/utils';

import { useUpdatableRef } from './useUpdatableRef';

export const useTimeout = (
  callback: EmptyFn,
  timeout: number,
  condition = true,
  deps: unknown[] = EMPTY_FROZEN_ARRAY
) => {
  const callbackRef = useUpdatableRef(callback);

  useEffect(() => {
    if (!condition) return;

    const timeoutId = setTimeout(() => void callbackRef.current(), timeout);

    return () => void clearTimeout(timeoutId);
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [condition, timeout, ...deps]);
};
