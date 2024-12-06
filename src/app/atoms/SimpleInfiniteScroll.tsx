import React, { memo, PropsWithChildren, useCallback, useState } from 'react';

import InfiniteScroll from 'react-infinite-scroll-component';

import { APP_CONTENT_PAPER_DOM_ID, SCROLL_DOCUMENT } from 'app/layouts/containers';

interface Props {
  loadNext: EmptyFn;
  scrollableTargetId?: string;
}

export const SimpleInfiniteScroll = memo<PropsWithChildren<Props>>(({ loadNext, scrollableTargetId, children }) => {
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
      // `InfiniteScroll`'s loader conditions r not suited here
      loader={null}
      scrollThreshold="600px"
      scrollableTarget={scrollableTarget}
    >
      {children}
    </InfiniteScroll>
  );
});
