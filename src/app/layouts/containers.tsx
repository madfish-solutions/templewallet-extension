import React, { FC, useRef, useState } from 'react';

import clsx from 'clsx';

import { useIntersectionObserver } from 'lib/ui/use-intersection-observer';
import { combineRefs } from 'lib/ui/utils';

export const LAYOUT_CONTAINER_CLASSNAME = 'max-w-full w-96 mx-auto';

interface ContentContainerProps extends PropsWithChildren {
  padding?: boolean;
  className?: string;
}

export const ContentContainer: FC<ContentContainerProps> = ({ padding = true, className, children }) => (
  <div
    className={clsx('flex-1 flex flex-col bg-background shadow-content-inset', padding && 'px-4 pt-4 pb-15', className)}
  >
    {children}
  </div>
);

interface StickyBarProps extends PropsWithChildren {
  className?: string;
}

export const StickyBar = React.forwardRef<HTMLDivElement, StickyBarProps>(({ className, children }, forwardedRef) => {
  const spareRef = useRef<HTMLDivElement>(null);

  const sticked = useStickyObservation(spareRef);

  return (
    <div
      ref={combineRefs(forwardedRef, spareRef)}
      className={clsx(
        'sticky -top-px z-sticky px-4 py-3 flex items-center gap-x-2 bg-white',
        sticked && 'shadow-bottom',
        className
      )}
    >
      {children}
    </div>
  );
});

/**
 * Solution is based on `IntersectionObserver`, thus the `top` value
 * of the sticky element needs to be `-1px`.
 *
 * Oterwise the element will never intersect with the top of the scrollable ancestor
 * (thus never triggering the intersection observer).
 */
export const useStickyObservation = (ref: React.RefObject<Element>, predicate = true) => {
  const [sticked, setSticked] = useState(false);

  useIntersectionObserver(
    ref,
    entry => setSticked(entry.intersectionRatio < 1),
    {
      threshold: [1]
    },
    predicate
  );

  return sticked;
};
