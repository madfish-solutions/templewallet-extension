import { RefObject } from 'react';

import { AD_SEEN_THRESHOLD } from 'lib/ads-constants';
import { useIntersectionObserver } from 'lib/ui/use-intersection-observer';

export const useAdRectObservation = (
  elemRef: RefObject<Element>,
  onAdRectVisible: SyncFn<boolean>,
  checkAdTrigger: boolean
) =>
  useIntersectionObserver(
    elemRef,
    entry => {
      onAdRectVisible(entry.isIntersecting);
    },
    {
      threshold: AD_SEEN_THRESHOLD
    },
    checkAdTrigger
  );
