import React, { FC, useLayoutEffect, useRef } from 'react';

import * as Woozie from 'lib/woozie';

interface Props extends React.HTMLAttributes<HTMLDivElement> {}

let SCROLL_RESTORATION = new Map<string, number>();
const MEMOIZED_SCROLLS_LIMIT = 10;

export const ScrollRestorer: FC<PropsWithChildren<Props>> = props => {
  const { trigger, href } = Woozie.useLocation();

  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // Only 'popstate' to location restores scroll position
    // Other navigation ways discard previous memoized position
    if (trigger !== 'popstate') return void SCROLL_RESTORATION.delete(href);

    if (SCROLL_RESTORATION.size > MEMOIZED_SCROLLS_LIMIT) {
      const slicedArray = Array.from(SCROLL_RESTORATION.entries()).slice(
        SCROLL_RESTORATION.size - MEMOIZED_SCROLLS_LIMIT
      );
      SCROLL_RESTORATION = new Map(slicedArray);
    }

    if (!ref.current) return;

    const scrollTop = SCROLL_RESTORATION.get(href);
    if (scrollTop == null) return;
    ref.current.scrollTop = scrollTop;
  }, [trigger, href]);

  return <div ref={ref} onScroll={onScroll} {...props} />;
};

function onScroll(event: React.UIEvent<HTMLDivElement>) {
  SCROLL_RESTORATION.set(window.location.href, event.currentTarget.scrollTop);
}
