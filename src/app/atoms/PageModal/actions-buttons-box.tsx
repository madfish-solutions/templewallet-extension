import React, { HTMLAttributes, memo, useRef } from 'react';

import clsx from 'clsx';

import { useElementValueWithEvents } from 'app/hooks/use-element-value-with-events';
import { useSetToastsContainerShift } from 'app/hooks/use-set-toasts-container-shift';

interface ActionsButtonsBoxProps extends HTMLAttributes<HTMLDivElement> {
  shouldCastShadow?: boolean;
  flexDirection?: 'row' | 'col';
}

const getDivHeight = (element: HTMLDivElement) => element.getBoundingClientRect().height;

const shiftUpdateEvents: string[] = [];

export const ActionsButtonsBox = memo<ActionsButtonsBoxProps>(
  ({ className, shouldCastShadow, flexDirection = 'col', ...restProps }) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const setToastsContainerShift = useSetToastsContainerShift();

    useElementValueWithEvents(rootRef, getDivHeight, 0, shiftUpdateEvents, 100, setToastsContainerShift);

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
