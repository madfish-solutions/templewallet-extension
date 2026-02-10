import { useMemo, useRef } from 'react';

export function useAbortSignal() {
  const ref = useRef<AbortController>(null);

  return useMemo(
    () => ({
      abort: () => {
        ref.current?.abort();

        ref.current = null;
      },
      abortAndRenewSignal: () => {
        ref.current?.abort();

        const ac = new AbortController();
        ref.current = ac;

        return ac.signal;
      }
    }),
    []
  );
}
