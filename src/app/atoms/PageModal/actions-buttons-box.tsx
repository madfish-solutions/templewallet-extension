import React, { HTMLAttributes, memo, useCallback, useEffect, useMemo } from 'react';

import clsx from 'clsx';
import { throttle } from 'lodash';
import { useDispatch } from 'react-redux';

import { setToastsContainerBottomShiftAction } from 'app/store/settings/actions';

interface ActionsButtonsBoxProps extends HTMLAttributes<HTMLDivElement> {
  shouldCastShadow?: boolean;
  flexDirection?: 'row' | 'col';
}

export const ActionsButtonsBox = memo<ActionsButtonsBoxProps>(
  ({ className, shouldCastShadow, flexDirection = 'col', ...restProps }) => {
    const dispatch = useDispatch();

    useEffect(() => {
      return () => void dispatch(setToastsContainerBottomShiftAction(0));
    }, []);

    const handleResize = useMemo(
      () =>
        throttle<ResizeObserverCallback>(entries => {
          const borderBoxSize = entries.map(entry => entry.borderBoxSize?.[0])[0];

          if (borderBoxSize) {
            dispatch(setToastsContainerBottomShiftAction(borderBoxSize.blockSize));
          }
        }, 100),
      [dispatch]
    );

    const resizeObserver = useMemo(() => new ResizeObserver(handleResize), [handleResize]);
    const rootRef = useCallback(
      (node: HTMLDivElement | null) => {
        resizeObserver.disconnect();
        if (node) {
          resizeObserver.observe(node);
          const { height } = node.getBoundingClientRect();
          dispatch(setToastsContainerBottomShiftAction(height));
        }
      },
      [dispatch, resizeObserver]
    );

    return (
      <div
        className={clsx(
          'p-4 pb-6 flex bg-white',
          `flex-${flexDirection}`,
          shouldCastShadow && 'shadow-bottom overflow-y-visible',
          className
        )}
        ref={rootRef}
        {...restProps}
      />
    );
  }
);
