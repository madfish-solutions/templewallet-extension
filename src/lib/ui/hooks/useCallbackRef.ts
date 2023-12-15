import { useRef } from 'react';

import { useIsomorphicLayoutEffect } from './useIsoLayoutEffect';

export function useCallbackRef(callback: () => any) {
  const callbackRef = useRef(callback);

  useIsomorphicLayoutEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return callbackRef;
}
