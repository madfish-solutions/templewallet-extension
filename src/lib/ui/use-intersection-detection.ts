import { RefObject, useEffect } from 'react';

import { useCallbackRef } from './hooks/useCallbackRef';

const IS_SUPPORTED = 'IntersectionObserver' in window;

export const useIntersectionDetection = (
  ref: RefObject<HTMLDivElement>,
  callback: (intersecting: boolean) => void,
  predicate = true,
  verticalOffset = 0
) => {
  const callbackRef = useCallbackRef(callback);

  useEffect(() => {
    const elem = ref.current;
    const canDetect = IS_SUPPORTED && predicate && elem;

    if (!canDetect) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        callbackRef.current(entry.isIntersecting);
      },
      { root: document, rootMargin: `${verticalOffset}px 0px ${verticalOffset}px 0px` }
    );

    observer.observe(elem);

    return () => {
      if (elem) {
        observer.unobserve(elem);
      }
    };
  }, [predicate, verticalOffset]);
};
