import React, { forwardRef, memo, PropsWithChildren, useCallback, useState } from 'react';

import InfiniteScrollBase from 'react-infinite-scroll-component';

import { APP_CONTENT_PAPER_DOM_ID, SCROLL_DOCUMENT } from 'app/layouts/containers';

export interface SimpleInfiniteScrollProps {
  loadNext: EmptyFn;
  onScroll?: SyncFn<MouseEvent>;
  scrollableTargetId?: string;
}

const InfiniteScroll = InfiniteScrollBase as unknown as React.ComponentType<any>;

export const SimpleInfiniteScroll = memo(
  forwardRef<any, PropsWithChildren<SimpleInfiniteScrollProps>>(
    ({ loadNext, onScroll, scrollableTargetId, children }, ref) => {
      const [seedForLoadNext, setSeedForLoadNext] = useState(0);

      const loadNextLocal = useCallback(() => {
        setSeedForLoadNext(val => (val % 2) + 1);
        loadNext();
      }, [loadNext]);

      const scrollableTarget = scrollableTargetId ?? (SCROLL_DOCUMENT ? undefined : APP_CONTENT_PAPER_DOM_ID);

      return (
        <InfiniteScroll
          // For non-array children (e.g. grid layout or other wrapper) this must be `true`
          hasChildren={true}
          hasMore={true}
          /**
           * Used only to determine, whether to call `next` on next scroll-to-end event.
           * If not updated, `next` will not be triggered - need to update artificially.
           * Example: If `loadNext` call throws an error, `dataLength` won't change & `next` is blocked.
           */
          dataLength={seedForLoadNext}
          next={loadNextLocal}
          onScroll={onScroll}
          // `InfiniteScroll`'s loader conditions r not suited here
          loader={null}
          scrollThreshold="600px"
          scrollableTarget={scrollableTarget}
          ref={ref}
        >
          {children}
        </InfiniteScroll>
      );
    }
  )
);
