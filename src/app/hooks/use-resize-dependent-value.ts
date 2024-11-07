import { useCallback, useMemo, useRef } from 'react';

import { throttle } from 'lodash';

import { useSafeState } from 'lib/ui/hooks';
import { useWillUnmount } from 'lib/ui/hooks/useWillUnmount';

export const useResizeDependentValue = <T, E extends HTMLElement>(
  fn: (element: E) => T,
  fallbackValue: T,
  throttleTime: number
) => {
  const [value, setValue] = useSafeState(fallbackValue);

  const ref = useRef<E | nullish>();

  const setValueThrottled = useMemo(
    () => throttle((value: T) => setValue(value), throttleTime),
    [setValue, throttleTime]
  );

  const resizeObserver = useMemo(
    () =>
      new ResizeObserver(() => {
        const node = ref.current;

        if (node) setValue(fn(node));
      }),
    [fn, setValue]
  );

  useWillUnmount(() => void resizeObserver.disconnect());

  const refFn = useCallback(
    (node: E | null) => {
      ref.current = node;
      if (!node) return void setValue(fallbackValue);

      resizeObserver.disconnect();
      resizeObserver.observe(node);

      setValue(fn(node));
    },
    [fallbackValue, fn, resizeObserver, setValue]
  );

  return {
    value,
    setValue: setValueThrottled,
    refFn
  };
};
