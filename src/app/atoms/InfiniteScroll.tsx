import React, { FC, ReactNode } from 'react';

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
  loader = <SyncSpinner className="mt-4" />,
  children
}) => {
  const loadNext = itemsLength ? loadMore : retryInitialLoad;

  const onScroll = isSyncing || reachedTheEnd ? undefined : buildOnScroll(loadNext);

  return (
    <ReactInfiniteScrollComponent
      dataLength={itemsLength}
      hasMore={reachedTheEnd === false}
      next={loadNext}
      loader={isSyncing && loader}
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
    const atBottom = 0 === elem.offsetHeight - elem.clientHeight - elem.scrollTop;
    if (atBottom) next();
  };
