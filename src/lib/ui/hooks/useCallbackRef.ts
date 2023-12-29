import { useRef } from 'react';

export function useCallbackRef(callback: Function) {
  const callbackRef = useRef(callback);

  callbackRef.current = callback;

  return callbackRef;
}
