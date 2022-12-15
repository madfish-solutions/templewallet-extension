import { useEffect } from 'react';

export function useWillUnmount(callback: EmptyFn) {
  // run only once
  useEffect(() => callback, []);
}
