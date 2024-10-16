import React, { HTMLAttributes, memo, useCallback, useEffect, useMemo } from 'react';

import clsx from 'clsx';
import { throttle } from 'lodash';
import { useDispatch } from 'react-redux';

import { useAppEnv } from 'app/env';
import { setToastsContainerBottomShiftAction } from 'app/store/settings/actions';

interface ActionsButtonsBoxProps extends HTMLAttributes<HTMLDivElement> {
  shouldCastShadow?: boolean;
  flexDirection?: 'row' | 'col';
  shouldChangeBottomShift?: boolean;
}

export const ActionsButtonsBox = memo<ActionsButtonsBoxProps>(
  ({ className, shouldCastShadow, flexDirection = 'col', shouldChangeBottomShift = true, ...restProps }) => {
    const dispatch = useDispatch();
    const { popup } = useAppEnv();

    useEffect(() => {
      return () => void (shouldChangeBottomShift && dispatch(setToastsContainerBottomShiftAction(0)));
    }, [dispatch, shouldChangeBottomShift]);

    const handleResize = useMemo(
      () =>
        throttle<ResizeObserverCallback>(entries => {
          const borderBoxSize = entries.map(entry => entry.borderBoxSize?.[0]).filter(Boolean)[0];

          if (borderBoxSize && shouldChangeBottomShift) {
            dispatch(setToastsContainerBottomShiftAction(borderBoxSize.blockSize - (popup ? 16 : 0)));
          }
        }, 100),
      [dispatch, popup, shouldChangeBottomShift]
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
          'p-4 pb-6 flex bg-white',
          `flex-${flexDirection}`,
          shouldCastShadow && 'shadow-bottom border-t-0.5 border-lines overflow-y-visible',
          className
        )}
        ref={rootRef}
        {...restProps}
      />
    );
  }
);
