import React, { HTMLAttributes, memo } from 'react';

import clsx from 'clsx';

import { useBottomShiftChangingElement } from 'app/hooks/use-bottom-shift-changing-element';

export interface ActionsButtonsBoxProps extends HTMLAttributes<HTMLDivElement> {
  shouldCastShadow?: boolean;
  flexDirection?: 'row' | 'col';
  bgSet?: boolean;
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
    const rootRef = useBottomShiftChangingElement(shouldChangeBottomShift);

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
