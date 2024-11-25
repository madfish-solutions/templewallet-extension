import React, { FC } from 'react';

import { EmptyState } from 'app/atoms/EmptyState';
import { InfiniteScroll } from 'app/atoms/InfiniteScroll';
import { Loader, PageLoader } from 'app/atoms/Loader';

interface Props {
  activitiesNumber: number;
  isSyncing: boolean;
  reachedTheEnd: boolean;
  loadNext: EmptyFn;
}

export const ActivityListView: FC<PropsWithChildren<Props>> = ({
  activitiesNumber,
  isSyncing,
  reachedTheEnd,
  loadNext,
  children
}) => {
  if (activitiesNumber === 0) {
    if (isSyncing) return <PageLoader stretch text="Activity is loading..." />;
    else if (reachedTheEnd) return <EmptyState stretch text="No activity yet" forSearch={false} />;
  }

  return (
    <InfiniteScroll
      itemsLength={activitiesNumber}
      isSyncing={isSyncing}
      reachedTheEnd={reachedTheEnd}
      retryInitialLoad={loadNext}
      loadMore={loadNext}
      loader={<Loader size="L" className="mt-4 mx-auto text-secondary" trackVariant="dark" />}
    >
      {children}
    </InfiniteScroll>
  );
};
