import React, { Fragment } from 'react';

import classNames from 'clsx';
import InfiniteScroll from 'react-infinite-scroll-component';

import { SyncSpinner } from 'app/atoms';
import { PartnersPromotion } from 'app/atoms/partners-promotion';
import { useAppEnv } from 'app/env';
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

  const { popup } = useAppEnv();

  const { publicKeyHash: accountAddress } = useAccount();

  // useLoadPartnersPromo();

  if (activities.length === 0 && !loading && reachedTheEnd) {
    return (
      <div
        className={classNames(
          'mt-3 mb-12 w-full max-w-sm mx-auto',
          'flex flex-col items-center justify-center',
          'text-gray-500'
        )}
      >
        <div className="w-full flex justify-center mb-6">
          <PartnersPromotion />
        </div>

        <LayersIcon className="w-16 h-auto mb-2 stroke-current" />

        <h3 className="text-sm font-light text-center" style={{ maxWidth: '20rem' }}>
          <T id="noOperationsFound" />
        </h3>
      </div>
    );
  }

  const retryInitialLoad = () => loadMore(INITIAL_NUMBER);
  const loadMoreActivities = () => loadMore(LOAD_STEP);

  const loadNext = activities.length === 0 ? retryInitialLoad : loadMoreActivities;

  const onScroll = loading || reachedTheEnd ? undefined : buildOnScroll(loadNext);

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className={classNames('my-3 flex flex-col', popup && 'mx-4')}>
        {loading && activities.length === 0 && (
          <div className="w-full mb-4 flex justify-center">
            <PartnersPromotion />
          </div>
        )}
        <InfiniteScroll
          dataLength={activities.length}
          hasMore={reachedTheEnd === false}
          next={loadNext}
          loader={loading && <SyncSpinner className="mt-4" />}
          onScroll={onScroll}
        >
          {activities.map((activity, index) => (
            <Fragment key={activity.hash}>
              <ActivityItem address={accountAddress} activity={activity} />
              {index === 0 && <PartnersPromotion />}
            </Fragment>
          ))}
        </InfiniteScroll>
      </div>
    </div>
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
