import React, { FC, ReactNode, useEffect } from 'react';

import ReactInfiniteScrollComponent from 'react-infinite-scroll-component';

import { APP_CONTENT_PAPER_DOM_ID, SCROLL_DOCUMENT } from 'app/layouts/containers';

import { SyncSpinner } from './SyncSpinner';

interface Props extends PropsWithChildren {
  itemsLength: number;
  isSyncing: boolean;
  reachedTheEnd: boolean;
  retryInitialLoad: EmptyFn;
  loadMore: EmptyFn;
  loader?: ReactNode;
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

  const onScroll = isSyncing || reachedTheEnd ? undefined : buildOnScroll(loadNext);

  // For when there are too few items to make initial scroll for loadMore:
  useEffect(() => {
    if (SCROLL_DOCUMENT || isSyncing || reachedTheEnd) return;

    const scrollableElem = document.getElementById(APP_CONTENT_PAPER_DOM_ID);

    if (!scrollableElem || scrollableElem.scrollTop || scrollableElem.scrollHeight > scrollableElem.clientHeight)
      return;

    if (isScrollAtTheEnd(scrollableElem)) loadNext();
  }, [isSyncing, reachedTheEnd]);

  return (
    <ReactInfiniteScrollComponent
      dataLength={itemsLength}
      hasMore={reachedTheEnd === false}
      next={loadNext}
      loader={isSyncing && (loader ?? <SyncSpinner className="mt-4" />)}
      onScroll={onScroll}
      scrollableTarget={SCROLL_DOCUMENT ? undefined : APP_CONTENT_PAPER_DOM_ID}
    >
      {children}
    </ReactInfiniteScrollComponent>
  );
};

/**
 * Build onscroll listener to trigger next loading, when fetching data resulted in error.
 * `InfiniteScroll.props.next` won't be triggered in this case.
 */
const buildOnScroll =
  (next: EmptyFn) =>
  ({ target }: { target: EventTarget | null }) => {
    const elem: HTMLElement =
      target instanceof Document ? (target.scrollingElement! as HTMLElement) : (target as HTMLElement);

    if (isScrollAtTheEnd(elem)) next();
  };

function isScrollAtTheEnd(elem: Element) {
  // return 0 === elem.offsetHeight - elem.clientHeight - elem.scrollTop;
  return elem.scrollHeight === elem.clientHeight + elem.scrollTop;
}