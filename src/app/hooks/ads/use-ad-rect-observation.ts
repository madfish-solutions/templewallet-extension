import { RefObject } from 'react';

import { AD_SEEN_THRESHOLD } from 'lib/constants';
import { useIntersectionObserver } from 'lib/ui/use-intersection-observer';

export const useAdRectObservation = (elemRef: RefObject<Element>, onAdRectSeen: EmptyFn, checkAdTrigger: boolean) =>
  useIntersectionObserver(
    elemRef,
    entry => {
      if (entry.isIntersecting) onAdRectSeen();
    },
    {
      threshold: AD_SEEN_THRESHOLD
    },
    checkAdTrigger
  );
