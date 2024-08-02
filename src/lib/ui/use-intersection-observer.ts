import { RefObject, useEffect } from 'react';

import { useUpdatableRef } from './hooks';

const IS_SUPPORTED = 'IntersectionObserver' in window;

export const useIntersectionObserver = (
  elemRef: RefObject<Element>,
  callback: (entry: IntersectionObserverEntry) => void,
  init: IntersectionObserverInit,
  predicate = true
) => {
  const callbackRef = useUpdatableRef(callback);

  useEffect(() => {
    const elem = elemRef.current;
    const canDetect = IS_SUPPORTED && predicate && elem;

    if (!canDetect) return;

    const observer = new IntersectionObserver(([entry]) => {
      callbackRef.current(entry);
    }, init);

    observer.observe(elem);

    return () => void observer.unobserve(elem);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [predicate]);
};
