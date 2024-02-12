import { useRef } from 'react';

export function useUpdatableRef<T>(value: T) {
  const callbackRef = useRef(value);

  callbackRef.current = value;

  return callbackRef;
}
