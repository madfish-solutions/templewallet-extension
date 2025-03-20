import React, { HTMLAttributes, memo, useCallback, useMemo } from 'react';

import clsx from 'clsx';
import { throttle } from 'lodash';
import { useDispatch } from 'react-redux';

import { setToastsContainerBottomShiftAction } from 'app/store/settings/actions';
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
    const dispatch = useDispatch();

    useWillUnmount(() => {
      if (shouldChangeBottomShift) void dispatch(setToastsContainerBottomShiftAction(0));
    });

    const resizeObserver = useMemo(
      () =>
        new ResizeObserver(
          throttle<ResizeObserverCallback>(entries => {
            const borderBoxSize = entries.find(entry => entry.borderBoxSize[0])?.borderBoxSize[0];

            if (borderBoxSize && shouldChangeBottomShift) {
              dispatch(setToastsContainerBottomShiftAction(borderBoxSize.blockSize - 24));
            }
          }, 100)
        ),
      [shouldChangeBottomShift, dispatch]
    );

    const rootRef = useCallback(
      (node: HTMLDivElement | null) => {
        resizeObserver.disconnect();

        if (node && shouldChangeBottomShift) {
          resizeObserver.observe(node);

          const { height } = node.getBoundingClientRect();

          dispatch(setToastsContainerBottomShiftAction(height));
        }
      },
      [resizeObserver, shouldChangeBottomShift, dispatch]
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
