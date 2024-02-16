import { useEffect, useRef } from 'react';

import { useDidMount } from './useDidMount';
import { useUpdatableRef } from './useUpdatableRef';
import { useWillUnmount } from './useWillUnmount';

export function useDidUpdate(callback: EmptyFn, conditions: unknown[]) {
  const hasMountedRef = useRef(false);
  const callbackRef = useUpdatableRef(callback);

  useEffect(() => {
    if (hasMountedRef.current) {
      callbackRef.current();
    }
  }, conditions);

  useDidMount(() => {
    hasMountedRef.current = true;
  });

  useWillUnmount(() => {
    hasMountedRef.current = false;
  });
}
