import { RefObject, useEffect } from 'react';

import { useUpdatableRef } from './hooks';

const IS_SUPPORTED = 'IntersectionObserver' in window;

type ObserverInit = Omit<IntersectionObserverInit, 'rootMargin'>;

/**
 * Memoize rootMargin to avoid unnecessary Intersection Observer re-creations.
 */
export const useIntersectionObserver = (
  elemRef: RefObject<Element | null>,
  callback: (entry: IntersectionObserverEntry) => void,
  /** A function is called when the observer is created, after mount: for a root element looked up in the DOM. */
  init: ObserverInit | (() => ObserverInit),
  predicate = true,
  rootMargin?: string,
  /** A new value re-creates the observer, which reports the element's current intersection again. */
  resetKey?: unknown
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
      { ...(typeof init === 'function' ? init() : init), rootMargin }
    );

    observer.observe(elem);

    return () => void observer.unobserve(elem);
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [rootMargin, predicate, resetKey]);
};
