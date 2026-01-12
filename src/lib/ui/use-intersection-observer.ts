import { RefObject, useEffect } from 'react';

import { useUpdatableRef } from './hooks';

const IS_SUPPORTED = 'IntersectionObserver' in window;

/**
 * Memoize rootMargin to avoid unnecessary Intersection Observer re-creations.
 */
export const useIntersectionObserver = (
  elemRef: RefObject<Element | null>,
  callback: (entry: IntersectionObserverEntry) => void,
  init: Omit<IntersectionObserverInit, 'rootMargin'>,
  predicate = true,
  rootMargin?: string
) => {
  const callbackRef = useUpdatableRef(callback);

  useEffect(() => {
    const elem = elemRef.current;
    const canDetect = IS_SUPPORTED && predicate && elem;

    if (!canDetect) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        callbackRef.current(entry);
      },
      { ...init, rootMargin }
    );

    observer.observe(elem);

    return () => void observer.unobserve(elem);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootMargin, predicate]);
};
