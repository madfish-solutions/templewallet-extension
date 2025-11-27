import React, { forwardRef, useRef } from 'react';

import clsx from 'clsx';

import { useStickyObservation } from 'app/hooks/use-sticky-observation';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
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
  withShadow?: boolean;
  className?: string;
}

export const ContentContainer = forwardRef<HTMLDivElement, ContentContainerProps>(
  ({ padding = true, withShadow = true, className, children }, ref) => (
    <div
      ref={ref}
      className={clsx(
        'flex-grow flex flex-col bg-background',
        padding && 'px-4 pt-4 pb-15',
        withShadow && 'shadow-content-inset',
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

  const testnetModeEnabled = useTestnetModeEnabledSelector();

  const sticked = useStickyObservation(spareRef);

  return (
    <div
      ref={combineRefs(forwardedRef, spareRef)}
      className={clsx(
        'sticky z-sticky px-4 py-3 flex items-center gap-x-2 bg-white',
        testnetModeEnabled ? 'top-[23px]' : '-top-px',
        sticked && 'shadow-bottom',
        className
      )}
    >
      {children}
    </div>
  );
});
