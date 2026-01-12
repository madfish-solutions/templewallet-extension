import React, { CSSProperties, FC, ReactElement, useEffect, useMemo } from 'react';

import ReactInfiniteScrollComponent from 'react-infinite-scroll-component';

import { APP_CONTENT_PAPER_DOM_ID, SCROLL_DOCUMENT } from 'app/layouts/containers';

import { LoaderDebounce } from './LoaderDebounce';
import { SyncSpinner } from './SyncSpinner';

interface Props extends PropsWithChildren {
  itemsLength: number;
  isSyncing: boolean;
  reachedTheEnd: boolean;
  retryInitialLoad: EmptyFn;
  loadMore: EmptyFn;
  loader?: ReactElement;
}

export const InfiniteScroll: FC<Props> = ({
  itemsLength,
  isSyncing,
  reachedTheEnd,
  retryInitialLoad,
  loadMore,
  loader,
  children
}) => {
  const loadNext = itemsLength ? loadMore : retryInitialLoad;

  /**
   * Build onscroll listener to trigger next loading, when fetching data resulted in error.
   * `InfiniteScroll.props.next` won't be triggered in this case.
   */
  const onScroll = useMemo(() => {
    if (isSyncing || reachedTheEnd) return;

    return ({ target }: { target: EventTarget | null }) => {
      const elem = (target instanceof Document ? target.scrollingElement! : target) as HTMLElement;

      if (isScrollAtTheEnd(elem)) loadNext();
    };
  }, [loadNext, isSyncing, reachedTheEnd]);

  const scrollableElem = useMemo(() => document.getElementById(APP_CONTENT_PAPER_DOM_ID), []);

  // For when there are too few items to make initial scroll for loadMore:
  useEffect(() => {
    if (SCROLL_DOCUMENT || isSyncing || reachedTheEnd) return;

    if (!scrollableElem || scrollableElem.scrollTop || scrollableElem.scrollHeight > scrollableElem.clientHeight)
      return;

    if (isScrollAtTheEnd(scrollableElem)) loadNext();
  }, [isSyncing, itemsLength, reachedTheEnd]);

  return (
    <ReactInfiniteScrollComponent
      dataLength={itemsLength}
      hasMore={!reachedTheEnd}
      next={loadNext}
      onScroll={onScroll}
      loader={null} // Doesn't always show this way
      scrollableTarget={SCROLL_DOCUMENT ? undefined : APP_CONTENT_PAPER_DOM_ID}
      style={STYLE}
    >
      {children}

      <LoaderDebounce isSyncing={isSyncing} keepTime={2_000}>
        {loader ?? <SyncSpinner className="mt-4" />}
      </LoaderDebounce>
    </ReactInfiniteScrollComponent>
  );
};

const STYLE: CSSProperties = {
  /** Scrollable element must be an ancestor of this component - document or other. */
  overflow: 'unset'
};

function isScrollAtTheEnd(elem: Element) {
  return elem.scrollHeight === elem.clientHeight + elem.scrollTop;
}
