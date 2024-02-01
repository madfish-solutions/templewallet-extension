import { useCallback, useEffect, useRef } from 'react';

export const useTimeout = (): [(callback: () => void, delay: number) => void, () => void] => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const clear = useCallback(() => {
    timeoutRef.current && clearTimeout(timeoutRef.current);
  }, []);

  const set = useCallback(
    (callback: () => void, delay: number) => {
      clear();
      timeoutRef.current = setTimeout(callback, delay);
    },
    [clear]
  );

  useEffect(() => {
    return clear;
  }, [clear]);

  return [set, clear];
};
