import { useEffect } from 'react';

export function useDidMount(callback: EmptyFn) {
  useEffect(() => {
    if (typeof callback === 'function') {
      callback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
