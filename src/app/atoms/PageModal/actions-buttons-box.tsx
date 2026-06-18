import { HTMLAttributes, FC, RefObject, useCallback, useRef, useState } from 'react';

import clsx from 'clsx';
import { throttle } from 'lodash';

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
  const cleanupShadowObservationRef = useRef<EmptyFn | null>(null);
  const castsShadowRef = useRef(false);
  const [castsShadow, setCastsShadow] = useState(false);

  const updateShadow = useCallback(() => {
    const scrollContainer = scrollContainerRef?.current;

    if (!scrollContainer) {
      if (castsShadowRef.current) {
        castsShadowRef.current = false;
        setCastsShadow(false);
      }

      return;
    }

    const nextCastsShadow = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight > 1;

    if (nextCastsShadow === castsShadowRef.current) {
      return;
    }

    castsShadowRef.current = nextCastsShadow;
    setCastsShadow(nextCastsShadow);
  }, [scrollContainerRef]);

  const shadowObservationRef = useCallback(
    (node: HTMLDivElement | null) => {
      cleanupShadowObservationRef.current?.();
      cleanupShadowObservationRef.current = null;

      if (!node || !scrollContainerRef) {
        castsShadowRef.current = false;
        setCastsShadow(false);

        return;
      }

      const throttledUpdateShadow = throttle(updateShadow, 20);
      let resizeObserver: ResizeObserver | null = null;
      let mutationObserver: MutationObserver | null = null;
      let observedScrollContainer: HTMLElement | null = null;

      const attachToScrollContainer = () => {
        const scrollContainer = scrollContainerRef.current;

        updateShadow();

        if (!scrollContainer || scrollContainer === observedScrollContainer) {
          return;
        }

        resizeObserver?.disconnect();
        mutationObserver?.disconnect();
        observedScrollContainer?.removeEventListener('scroll', throttledUpdateShadow);

        observedScrollContainer = scrollContainer;
        resizeObserver = new ResizeObserver(throttledUpdateShadow);
        mutationObserver = new MutationObserver(throttledUpdateShadow);

        resizeObserver.observe(scrollContainer);
        resizeObserver.observe(node);
        mutationObserver.observe(scrollContainer, { childList: true, subtree: true });
        scrollContainer.addEventListener('scroll', throttledUpdateShadow, { passive: true });
      };
      const animationFrameId = requestAnimationFrame(attachToScrollContainer);

      attachToScrollContainer();

      cleanupShadowObservationRef.current = () => {
        cancelAnimationFrame(animationFrameId);
        resizeObserver?.disconnect();
        mutationObserver?.disconnect();
        observedScrollContainer?.removeEventListener('scroll', throttledUpdateShadow);
        throttledUpdateShadow.cancel();
      };
    },
    [scrollContainerRef, updateShadow]
  );

  return (
    <div
      ref={combineRefs(bottomShiftRef, shadowObservationRef)}
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
