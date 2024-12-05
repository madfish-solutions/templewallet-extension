import React, { Children, HTMLAttributes, memo, useCallback, useEffect, useMemo } from 'react';

import clsx from 'clsx';
import { throttle } from 'lodash';
import { useDispatch } from 'react-redux';

import { setToastsContainerBottomShiftAction } from 'app/store/settings/actions';

interface ActionsButtonsBoxProps extends HTMLAttributes<HTMLDivElement> {
  shouldCastShadow?: boolean;
  bgSet?: false;
  shouldChangeBottomShift?: boolean;
}

export const ActionsButtonsBox = memo<ActionsButtonsBoxProps>(
  ({ className, shouldCastShadow, bgSet = true, shouldChangeBottomShift = true, children, ...restProps }) => {
    const dispatch = useDispatch();

    useEffect(() => {
      return () => void (shouldChangeBottomShift && dispatch(setToastsContainerBottomShiftAction(0)));
    }, [dispatch, shouldChangeBottomShift]);

    const handleResize = useMemo(
      () =>
        throttle<ResizeObserverCallback>(entries => {
          const borderBoxSize = entries.map(entry => entry.borderBoxSize[0]).filter(Boolean)[0];

          if (borderBoxSize && shouldChangeBottomShift) {
            dispatch(setToastsContainerBottomShiftAction(borderBoxSize.blockSize - 24));
          }
        }, 100),
      [dispatch, shouldChangeBottomShift]
    );

    const resizeObserver = useMemo(() => new ResizeObserver(handleResize), [handleResize]);
    const rootRef = useCallback(
      (node: HTMLDivElement | null) => {
        resizeObserver.disconnect();
        if (node && shouldChangeBottomShift) {
          resizeObserver.observe(node);
          const { height } = node.getBoundingClientRect();
          dispatch(setToastsContainerBottomShiftAction(height));
        }
      },
      [dispatch, resizeObserver, shouldChangeBottomShift]
    );

    return (
      <div
        className={clsx(
          'p-4 pb-6 flex',
          Children.count(children) > 1 ? 'flex-row gap-2.5' : 'flex-col',
          bgSet && 'bg-white',
          shouldCastShadow && 'shadow-bottom border-t-0.5 border-lines overflow-y-visible',
          className
        )}
        ref={rootRef}
        {...restProps}
      >
        {children}
      </div>
    );
  }
);
