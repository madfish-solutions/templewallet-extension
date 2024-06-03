import React, { HTMLAttributes, memo, useCallback, useEffect, useRef } from 'react';

import clsx from 'clsx';
import { noop } from 'lodash';

import { useElementValueWithEvents } from 'app/hooks/use-element-value-with-events';

interface ScrollViewProps extends HTMLAttributes<HTMLDivElement> {
  onBottomEdgeVisibilityChange?: (isVisible: boolean) => void;
  bottomEdgeThreshold?: number;
}

const bottomEdgeIsVisible = (element: HTMLDivElement, threshold: number) =>
  element.scrollHeight - element.scrollTop - element.clientHeight <= threshold;

const scrollEdgesChangeEvents = ['scroll'];

export const ScrollView = memo<ScrollViewProps>(
  ({ className, onBottomEdgeVisibilityChange = noop, bottomEdgeThreshold = 0, ...restProps }) => {
    const rootRef = useRef<HTMLDivElement>(null);

    const localBottomEdgeIsVisible = useCallback(
      (element: HTMLDivElement) => bottomEdgeIsVisible(element, bottomEdgeThreshold),
      [bottomEdgeThreshold]
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
      window.addEventListener('resize', updateBottomEdgeVisibilityChange);

      return () => window.removeEventListener('resize', updateBottomEdgeVisibilityChange);
    }, [updateBottomEdgeVisibilityChange]);

    return (
      <div className={clsx('px-4 flex-1 flex flex-col overflow-y-auto', className)} ref={rootRef} {...restProps} />
    );
  }
);
