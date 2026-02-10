import { RefObject, useEffect, useMemo, useState } from 'react';

import { useContentPaperRef } from 'app/layouts/PageLayout/context';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { useIntersectionObserver } from 'lib/ui/use-intersection-observer';

/**
 * Solution is based on `IntersectionObserver`, thus the `top` value
 * of the sticky element needs to be `-1px` and `23px` when in testnet mode.
 *
 * Otherwise, the element will never intersect with the top of the scrollable ancestor
 * (thus never triggering the intersection observer).
 */
export const useStickyObservation = (ref: RefObject<Element | null>, predicate = true) => {
  const [sticked, setSticked] = useState(false);
  const [localPredicate, setLocalPredicate] = useState(false);

  const rootRef = useContentPaperRef();

  const testnetModeEnabled = useTestnetModeEnabledSelector();

  const rootMargin = useMemo(() => (testnetModeEnabled ? '-24px 0px 0px 0px' : undefined), [testnetModeEnabled]);

  useEffect(() => {
    if (!localPredicate && rootRef.current) setLocalPredicate(true);
  }, [localPredicate, rootRef]);

  useIntersectionObserver(
    ref,
    entry => {
      setSticked(entry.intersectionRatio < 1);
    },
    {
      root: rootRef.current,
      threshold: [1]
    },
    predicate && localPredicate,
    rootMargin
  );

  return sticked;
};
