import { HTMLAttributes, FC, RefObject } from 'react';

import clsx from 'clsx';

import { useActionsButtonsBoxShadow } from 'app/hooks/use-actions-buttons-box-shadow';
import { useBottomShiftChangingElement } from 'app/hooks/use-bottom-shift-changing-element';
import { combineRefs } from 'lib/ui/utils';

export interface ActionsButtonsBoxProps extends HTMLAttributes<HTMLDivElement> {
  bgSet?: boolean;
  flexDirection?: 'row' | 'col';
  shouldChangeBottomShift?: boolean;
  scrollContainerRef?: RefObject<HTMLElement | null>;
}

export const ActionsButtonsBox: FC<ActionsButtonsBoxProps> = ({
  bgSet = true,
  flexDirection = 'col',
  shouldChangeBottomShift = true,
  scrollContainerRef,
  className,
  ...rest
}) => {
  const bottomShiftRef = useBottomShiftChangingElement(shouldChangeBottomShift);
  const [castsShadow, shadowRef] = useActionsButtonsBoxShadow(scrollContainerRef);

  return (
    <div
      ref={combineRefs(bottomShiftRef, shadowRef)}
      className={clsx(
        'p-4 pb-6 flex gap-2.5',
        `flex-${flexDirection}`,
        bgSet && 'bg-white',
        castsShadow && 'shadow-top overflow-y-visible',
        className
      )}
      {...rest}
    />
  );
};
