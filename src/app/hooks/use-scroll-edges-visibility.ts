import { RefObject, startTransition, useEffect, useMemo, useRef } from 'react';

import { noop, throttle } from 'lodash';

const bottomEdgeIsVisible = (element: HTMLDivElement, threshold: number) =>
  element.scrollHeight - element.scrollTop - element.clientHeight <= threshold;
const topEdgeIsVisible = (element: HTMLDivElement, threshold: number) => element.scrollTop <= threshold;

export const useScrollEdgesVisibility = (
  ref: RefObject<HTMLDivElement | null>,
  onBottomEdgeVisibilityChange: SyncFn<boolean> = noop,
  bottomEdgeThreshold = 0,
  onTopEdgeVisibilityChange: SyncFn<boolean> = noop,
  topEdgeThreshold = 0
) => {
  const prevBottomEdgeIsVisibleRef = useRef(true);
  const prevTopEdgeIsVisibleRef = useRef(true);

  const updateEdgesVisibility = useMemo(
    () =>
      throttle(() => {
        if (!ref.current) {
          return;
        }

        const currentBottomEdgeIsVisible = bottomEdgeIsVisible(ref.current, bottomEdgeThreshold);
        const currentTopEdgeIsVisible = topEdgeIsVisible(ref.current, topEdgeThreshold);
        const bottomEdgeVisibilityChanged = currentBottomEdgeIsVisible !== prevBottomEdgeIsVisibleRef.current;
        const topEdgeVisibilityChanged = currentTopEdgeIsVisible !== prevTopEdgeIsVisibleRef.current;

        if (!bottomEdgeVisibilityChanged && !topEdgeVisibilityChanged) {
          return;
        }

        prevBottomEdgeIsVisibleRef.current = currentBottomEdgeIsVisible;
        prevTopEdgeIsVisibleRef.current = currentTopEdgeIsVisible;

        startTransition(() => {
          if (bottomEdgeVisibilityChanged) {
            onBottomEdgeVisibilityChange(currentBottomEdgeIsVisible);
          }

          if (topEdgeVisibilityChanged) {
            onTopEdgeVisibilityChange(currentTopEdgeIsVisible);
          }
        });
      }, 20),
    [bottomEdgeThreshold, onBottomEdgeVisibilityChange, onTopEdgeVisibilityChange, ref, topEdgeThreshold]
  );

  useEffect(() => {
    updateEdgesVisibility();

    const element = ref.current;
    if (!element) {
      return () => {
        updateEdgesVisibility.cancel();
      };
    }

    const resizeObserver = new ResizeObserver(updateEdgesVisibility);
    const mutationObserver = new MutationObserver(updateEdgesVisibility);

    resizeObserver.observe(element);
    mutationObserver.observe(element, { childList: true, subtree: true });
    element.addEventListener('scroll', updateEdgesVisibility, { passive: true });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      element.removeEventListener('scroll', updateEdgesVisibility);
      updateEdgesVisibility.cancel();
    };
  }, [ref, updateEdgesVisibility]);
};
