import React from 'react';

import classNames from 'clsx';
import InfiniteScroll from 'react-infinite-scroll-component';

import { ActivitySpinner } from 'app/atoms/ActivitySpinner';
import { ReactComponent as LayersIcon } from 'app/icons/layers.svg';
import { T } from 'lib/i18n/react';
import useActivities from 'lib/temple/activity-new/hook';
import { useAccount } from 'lib/temple/front';

import { ActivityItem } from './ActivityItem';

const INITIAL_NUMBER = 30;
const LOAD_STEP = 30;

interface Props {
  assetSlug?: string;
}

export const ActivityComponent: React.FC<Props> = ({ assetSlug }) => {
  const { loading, reachedTheEnd, list: activities, loadMore } = useActivities(INITIAL_NUMBER, assetSlug);

  const { publicKeyHash: accountAddress } = useAccount();

  const retryInitialLoad = () => loadMore(INITIAL_NUMBER);
  const loadMoreActivities = () => loadMore(LOAD_STEP);

  if (activities.length === 0 && !loading && reachedTheEnd)
    return (
      <div className={classNames('mt-4 mb-12', 'flex flex-col items-center justify-center', 'text-gray-500')}>
        <LayersIcon className="w-16 h-auto mb-2 stroke-current" />

        <h3 className="text-sm font-light text-center" style={{ maxWidth: '20rem' }}>
          <T id="noOperationsFound" />
        </h3>
      </div>
    );

  const loadNext = activities.length === 0 ? retryInitialLoad : loadMoreActivities;

  return (
    <div className="w-full max-w-md mx-auto flex flex-col">
      <InfiniteScroll
        dataLength={activities.length}
        hasMore={reachedTheEnd === false}
        next={loading || reachedTheEnd ? () => null : loadNext}
        loader={loading && <ActivitySpinner height="2.5rem" />}
        onScroll={({ target }) => {
          /*
            In case we catch an error on loading more items, `InfiniteScroll.next` won't trigger.
            Thus we also force its call here on condition of error.
          */
          if (loading || reachedTheEnd) return;
          const elem: HTMLElement =
            target instanceof Document ? (target.scrollingElement! as HTMLElement) : (target as HTMLElement);
          const atBottom = 0 === elem.offsetHeight - elem.clientHeight - elem.scrollTop;
          if (atBottom) loadNext();
        }}
      >
        {activities.map(activity => (
          <ActivityItem key={activity.hash} address={accountAddress} activity={activity} />
        ))}
      </InfiniteScroll>
    </div>
  );
};
