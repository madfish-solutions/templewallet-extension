import React, { HTMLAttributes, memo, useEffect, useMemo, useRef } from 'react';

import clsx from 'clsx';
import { noop, throttle } from 'lodash';

interface ScrollViewProps extends HTMLAttributes<HTMLDivElement> {
  onBottomEdgeVisibilityChange?: (isVisible: boolean) => void;
  bottomEdgeThreshold?: number;
}

const bottomEdgeIsVisible = (element: HTMLDivElement, threshold: number) =>
  element.scrollHeight - element.scrollTop - element.clientHeight <= threshold;

export const ScrollView = memo<ScrollViewProps>(
  ({ className, onBottomEdgeVisibilityChange = noop, bottomEdgeThreshold = 0, ...restProps }) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const prevBottomEdgeIsVisibleRef = useRef(true);

    const updateBottomEdgeIsVisible = useMemo(
      () =>
        throttle(() => {
          if (!rootRef.current) {
            return;
          }

          const currentBottomEdgeIsVisible = bottomEdgeIsVisible(rootRef.current, bottomEdgeThreshold);

          if (currentBottomEdgeIsVisible !== prevBottomEdgeIsVisibleRef.current) {
            prevBottomEdgeIsVisibleRef.current = currentBottomEdgeIsVisible;
            onBottomEdgeVisibilityChange(currentBottomEdgeIsVisible);
          }
        }, 20),
      [bottomEdgeThreshold, onBottomEdgeVisibilityChange]
    );

    useEffect(() => {
      updateBottomEdgeIsVisible();

      const element = rootRef.current;
      if (element) {
        window.addEventListener('resize', updateBottomEdgeIsVisible);
        element.addEventListener('scroll', updateBottomEdgeIsVisible);

        return () => {
          window.removeEventListener('resize', updateBottomEdgeIsVisible);
          element.removeEventListener('scroll', updateBottomEdgeIsVisible);
        };
      }

      return undefined;
    }, [updateBottomEdgeIsVisible]);

    return (
      <div className={clsx('px-4 flex-1 flex flex-col overflow-y-auto', className)} ref={rootRef} {...restProps} />
    );
  }
);
