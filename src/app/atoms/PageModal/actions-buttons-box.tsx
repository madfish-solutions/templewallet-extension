import React, { HTMLAttributes, memo, useCallback, useMemo } from 'react';

import clsx from 'clsx';
import { throttle } from 'lodash';

import { useToastsContainerBottomShift } from 'lib/temple/front/toasts-context';
import { useWillUnmount } from 'lib/ui/hooks/useWillUnmount';

export interface ActionsButtonsBoxProps extends HTMLAttributes<HTMLDivElement> {
  shouldCastShadow?: boolean;
  flexDirection?: 'row' | 'col';
  bgSet?: false;
  shouldChangeBottomShift?: boolean;
}

export const ActionsButtonsBox = memo<ActionsButtonsBoxProps>(
  ({
    className,
    flexDirection = 'col',
    shouldCastShadow,
    bgSet = true,
    shouldChangeBottomShift = true,
    ...restProps
  }) => {
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

    return (
      <div
        ref={rootRef}
        className={clsx(
          'p-4 pb-6 flex gap-2.5',
          `flex-${flexDirection}`,
          bgSet && 'bg-white',
          shouldCastShadow && 'shadow-bottom border-t-0.5 border-lines overflow-y-visible',
          className
        )}
        {...restProps}
      />
    );
  }
);
