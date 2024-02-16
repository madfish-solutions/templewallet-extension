import { RefObject, useEffect } from 'react';

import { useUpdatableRef } from './hooks';

const IS_SUPPORTED = 'IntersectionObserver' in window;

export const useIntersectionDetection = (
  elemRef: RefObject<Element>,
  callback: (intersecting: boolean) => void,
  predicate = true,
  verticalOffset = 0,
  root: Document | Element | null = document
) => {
  const callbackRef = useUpdatableRef(callback);

  useEffect(() => {
    const elem = elemRef.current;
    const canDetect = IS_SUPPORTED && predicate && elem;

    if (!canDetect) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        callbackRef.current(entry.isIntersecting);
      },
      {
        root,
        rootMargin: verticalOffset ? `${verticalOffset}px 0px ${verticalOffset}px 0px` : '0px'
      }
    );

    observer.observe(elem);

    return () => void observer.unobserve(elem);
  }, [predicate, verticalOffset]);
};
