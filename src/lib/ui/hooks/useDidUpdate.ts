import { useEffect, useRef } from 'react';

import { useCallbackRef } from './useCallbackRef';
import { useDidMount } from './useDidMount';
import { useWillUnmount } from './useWillUnmount';

export function useDidUpdate(callback: EmptyFn, conditions: unknown[]) {
  const hasMountedRef = useRef(false);
  const callbackRef = useCallbackRef(callback);

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
