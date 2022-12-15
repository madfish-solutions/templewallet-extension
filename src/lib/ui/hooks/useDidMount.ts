import { useEffect } from 'react';

export function useDidMount(callback: EmptyFn) {
  useEffect(() => {
    if (typeof callback === 'function') {
      callback();
    }
  }, []);
}
