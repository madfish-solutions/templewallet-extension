import React, { forwardRef, useRef, useState } from 'react';

import clsx from 'clsx';

import { useIntersectionObserver } from 'lib/ui/use-intersection-observer';
import { combineRefs } from 'lib/ui/utils';

export const SCROLL_DOCUMENT = process.env.SCROLL_DOCUMENT === 'true';
// (!) Condition mustn't be `if(!SCROLL_DOCUMENT)` - won't work for WebPack
if (process.env.SCROLL_DOCUMENT !== 'true') require('./PageLayout/custom-app-scroll.css');

export const APP_CONTENT_WRAP_DOM_ID = 'app-content-wrap';
export const APP_CONTENT_PAPER_DOM_ID = 'app-content-paper';

export const LAYOUT_CONTAINER_CLASSNAME = 'max-w-full w-96 mx-auto';
export const FULL_PAGE_LAYOUT_CONTAINER_CLASSNAME = 'min-h-80 rounded-md';

// Quantities in FULL_PAGE_WRAP_CLASSNAME and FULL_PAGE_WRAP_OVERLAY_CLASSNAME should be equal
export const FULL_PAGE_WRAP_CLASSNAME = 'pt-9 pb-8';
export const FULL_PAGE_WRAP_OVERLAY_CLASSNAME = 'top-9 bottom-8';

interface ContentContainerProps extends PropsWithChildren {
  padding?: boolean;
  className?: string;
}

export const ContentContainer = forwardRef<HTMLDivElement, ContentContainerProps>(
  ({ padding = true, className, children }, ref) => (
    <div
      ref={ref}
      className={clsx(
        'flex-1 flex flex-col bg-background shadow-content-inset',
        padding && 'px-4 pt-4 pb-15',
        className
      )}
    >
      {children}
    </div>
  )
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
