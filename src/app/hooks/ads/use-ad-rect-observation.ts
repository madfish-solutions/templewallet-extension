import { MutableRefObject, useCallback, useEffect, useMemo } from 'react';

import { adRectIsSeen } from 'lib/ads/ad-rect-is-seen';
import { AD_SEEN_THRESHOLD } from 'lib/constants';

export const useAdRectObservation = (
  ref: MutableRefObject<Element | null>,
  onAdRectSeen: () => void,
  checkAdTrigger: boolean
) => {
  const handleIntersectionEvents = useCallback(
    ([entry]: IntersectionObserverEntry[]) => {
      if (entry.isIntersecting) {
        onAdRectSeen();
      }
    },
    [onAdRectSeen]
  );

  const observer = useMemo(
    () => new IntersectionObserver(handleIntersectionEvents, { threshold: AD_SEEN_THRESHOLD }),
    [handleIntersectionEvents]
  );

  useEffect(() => {
    if (checkAdTrigger && ref.current && adRectIsSeen(ref.current)) {
      onAdRectSeen();
    }
  }, [checkAdTrigger, onAdRectSeen, ref]);

  useEffect(() => {
    const currentElement = ref.current;

    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [observer, ref]);
};
