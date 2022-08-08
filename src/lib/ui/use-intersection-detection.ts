import { RefObject, useEffect } from 'react';

/**
 * @deprecated
 *
 * use `import { List } from 'react-virtualized';` instead
 */
export const useIntersectionDetection = (ref: RefObject<HTMLDivElement>, callback: () => void, predicate = true) => {
  useEffect(() => {
    const el = ref.current;
    const isHitDetected = predicate && 'IntersectionObserver' in window && el;
    if (isHitDetected) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            callback();
          }
        },
        { rootMargin: '0px' }
      );

      if (el) {
        observer.observe(el);
      }
      return () => {
        if (el) {
          observer.unobserve(el);
        }
      };
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callback, predicate]);
};
