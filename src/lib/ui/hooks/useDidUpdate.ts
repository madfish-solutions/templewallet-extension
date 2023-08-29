import { useEffect, useRef, useMemo } from 'react';

import { useDidMount } from './useDidMount';
import { useWillUnmount } from './useWillUnmount';

export function useDidUpdate(callback: EmptyFn, conditions?: unknown[]) {
  const hasMountedRef = useRef(false);

  const internalConditions = useMemo(() => {
    if (typeof conditions !== 'undefined' && !Array.isArray(conditions)) {
      return [conditions];
    } else if (Array.isArray(conditions) && conditions.length === 0) {
      console.warn(
        'Using [] as the second argument makes useDidUpdate a noop. The second argument should either be `undefined` or an array of length greater than 0.'
      );
    }
    return conditions;
  }, [conditions]);

  useEffect(() => {
    if (hasMountedRef.current) {
      callback();
    }
  }, internalConditions);

  useDidMount(() => {
    hasMountedRef.current = true;
  });

  useWillUnmount(() => {
    hasMountedRef.current = false;
  });
}
