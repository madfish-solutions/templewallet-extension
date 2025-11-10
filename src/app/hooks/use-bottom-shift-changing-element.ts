import { useCallback, useMemo } from 'react';

import { throttle } from 'lodash';

import { useToastsContainerBottomShift } from 'lib/temple/front/toasts-context';
import { useWillUnmount } from 'lib/ui/hooks/useWillUnmount';

export const useBottomShiftChangingElement = (shouldChangeBottomShift: boolean) => {
  const [_, setToastsContainerBottomShift] = useToastsContainerBottomShift();

  useWillUnmount(() => {
    if (shouldChangeBottomShift) void setToastsContainerBottomShift(0);
  });

  const resizeObserver = useMemo(
    () =>
      new ResizeObserver(
        throttle<ResizeObserverCallback>(entries => {
          const borderBoxSize = entries.find(entry => entry.borderBoxSize[0])?.borderBoxSize[0];

          if (borderBoxSize && shouldChangeBottomShift) {
            setToastsContainerBottomShift(borderBoxSize.blockSize - 24);
          }
        }, 100)
      ),
    [setToastsContainerBottomShift, shouldChangeBottomShift]
  );

  const rootRef = useCallback(
    (node: HTMLDivElement | null) => {
      resizeObserver.disconnect();

      if (node && shouldChangeBottomShift) {
        resizeObserver.observe(node);

        const { height } = node.getBoundingClientRect();

        setToastsContainerBottomShift(height - 24);
      }
    },
    [resizeObserver, setToastsContainerBottomShift, shouldChangeBottomShift]
  );

  return rootRef;
};
