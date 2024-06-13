import { RefObject, useEffect, useMemo, useRef } from 'react';

import { noop, throttle } from 'lodash';

const bottomEdgeIsVisible = (element: HTMLDivElement, threshold: number) =>
  element.scrollHeight - element.scrollTop - element.clientHeight <= threshold;
const topEdgeIsVisible = (element: HTMLDivElement, threshold: number) => element.scrollTop <= threshold;

export const useScrollEdgesVisibility = (
  ref: RefObject<HTMLDivElement>,
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
        if (currentBottomEdgeIsVisible !== prevBottomEdgeIsVisibleRef.current) {
          prevBottomEdgeIsVisibleRef.current = currentBottomEdgeIsVisible;
          onBottomEdgeVisibilityChange(currentBottomEdgeIsVisible);
        }

        const currentTopEdgeIsVisible = topEdgeIsVisible(ref.current, topEdgeThreshold);
        if (currentTopEdgeIsVisible !== prevTopEdgeIsVisibleRef.current) {
          prevTopEdgeIsVisibleRef.current = currentTopEdgeIsVisible;
          onTopEdgeVisibilityChange(currentTopEdgeIsVisible);
        }
      }, 20),
    [bottomEdgeThreshold, onBottomEdgeVisibilityChange, onTopEdgeVisibilityChange, ref, topEdgeThreshold]
  );

  const resizeObserver = useMemo(() => new ResizeObserver(updateEdgesVisibility), [updateEdgesVisibility]);
  const mutationObserver = useMemo(() => new MutationObserver(updateEdgesVisibility), [updateEdgesVisibility]);

  useEffect(() => {
    updateEdgesVisibility();

    const element = ref.current;
    if (element) {
      resizeObserver.observe(element);
      mutationObserver.observe(element, { childList: true, subtree: true });
      element.addEventListener('scroll', updateEdgesVisibility);

      return () => {
        resizeObserver.disconnect();
        mutationObserver.disconnect();
        element.removeEventListener('scroll', updateEdgesVisibility);
      };
    }

    return undefined;
  }, [mutationObserver, ref, resizeObserver, updateEdgesVisibility]);
};
