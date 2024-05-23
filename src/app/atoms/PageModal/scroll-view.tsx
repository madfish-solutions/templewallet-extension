import React, { HTMLAttributes, memo, useCallback, useEffect, useRef } from 'react';

import clsx from 'clsx';
import { noop } from 'lodash';

import { useElementValueWithEvents } from 'app/hooks/use-element-value-with-events';

interface ScrollViewProps extends HTMLAttributes<HTMLDivElement> {
  onTopEdgeVisibilityChange?: (isVisible: boolean) => void;
  topEdgeThreshold?: number;
  onBottomEdgeVisibilityChange?: (isVisible: boolean) => void;
  bottomEdgeThreshold?: number;
}

const topEdgeIsVisible = (element: HTMLDivElement, threshold: number) => element.scrollTop <= threshold;
const bottomEdgeIsVisible = (element: HTMLDivElement, threshold: number) =>
  element.scrollHeight - element.scrollTop - element.clientHeight <= threshold;

const scrollEdgesChangeEvents = ['scroll'];

export const ScrollView = memo<ScrollViewProps>(
  ({
    className,
    onTopEdgeVisibilityChange = noop,
    topEdgeThreshold = 0,
    onBottomEdgeVisibilityChange = noop,
    bottomEdgeThreshold = 0,
    ...restProps
  }) => {
    const rootRef = useRef<HTMLDivElement>(null);

    const localTopEdgeIsVisible = useCallback(
      (element: HTMLDivElement) => topEdgeIsVisible(element, topEdgeThreshold),
      [topEdgeThreshold]
    );
    const localBottomEdgeIsVisible = useCallback(
      (element: HTMLDivElement) => bottomEdgeIsVisible(element, bottomEdgeThreshold),
      [bottomEdgeThreshold]
    );

    const { updateValue: updateTopEdgeVisibilityChange } = useElementValueWithEvents(
      rootRef,
      localTopEdgeIsVisible,
      true,
      scrollEdgesChangeEvents,
      20,
      onTopEdgeVisibilityChange
    );
    const { updateValue: updateBottomEdgeVisibilityChange } = useElementValueWithEvents(
      rootRef,
      localBottomEdgeIsVisible,
      true,
      scrollEdgesChangeEvents,
      20,
      onBottomEdgeVisibilityChange
    );

    useEffect(() => {
      const resizeHandler = () => {
        updateTopEdgeVisibilityChange();
        updateBottomEdgeVisibilityChange();
      };

      window.addEventListener('resize', resizeHandler);

      return () => window.removeEventListener('resize', resizeHandler);
    }, [updateBottomEdgeVisibilityChange, updateTopEdgeVisibilityChange]);

    return (
      <div className={clsx('px-4 flex-1 flex flex-col overflow-y-auto', className)} ref={rootRef} {...restProps} />
    );
  }
);
