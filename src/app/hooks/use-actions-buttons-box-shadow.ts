import { RefObject, useRef, useState } from 'react';

import { throttle } from 'lodash';

export const useActionsButtonsBoxShadow = (scrollContainerRef?: RefObject<HTMLElement | null>) => {
  const cleanupShadowObservationRef = useRef<EmptyFn | null>(null);
  const castsShadowRef = useRef(false);
  const [castsShadow, setCastsShadow] = useState(false);

  const updateShadow = () => {
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
  };

  const shadowRef = (node: HTMLElement | null) => {
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
  };

  return [castsShadow, shadowRef] as const;
};
