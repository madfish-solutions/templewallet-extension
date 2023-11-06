import React, { FC, PropsWithChildren } from 'react';

import InfiniteScroll from 'react-infinite-scroll-component';

interface Props {
  /**
   * Used only to determine, whether to call `next` on next scroll-to-end event.
   * If not updated, `next` will not be triggered - need to update artificially.
   * Example: If `loadNext` call throws an error, `dataLength` won't change & `next` is blocked.
   */
  seedForLoadNext: number;
  loadNext: EmptyFn;
}

export const SimpleInfiniteScroll: FC<PropsWithChildren<Props>> = ({ seedForLoadNext, loadNext, children }) => (
  <InfiniteScroll
    // For non-array children (e.g. grid layout or other wrapper) this must be `true`
    hasChildren={true}
    hasMore={true}
    dataLength={seedForLoadNext}
    next={loadNext}
    // `InfiniteScroll`'s loader conditions r not suited here
    loader={null}
    scrollThreshold={0.95}
  >
    {children}
  </InfiniteScroll>
);
