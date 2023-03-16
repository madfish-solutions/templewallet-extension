import React, { Fragment, useEffect } from 'react';

import classNames from 'clsx';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useDispatch } from 'react-redux';

import { ActivitySpinner } from 'app/atoms';
import { PartnersPromotion, PartnersPromotionVariant } from 'app/atoms/partners-promotion';
import { useAppEnv } from 'app/env';
import { ReactComponent as LayersIcon } from 'app/icons/layers.svg';
import { loadPartnersPromoAction } from 'app/store/partners-promotion/actions';
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
  const dispatch = useDispatch();
  const { loading, reachedTheEnd, list: activities, loadMore } = useActivities(INITIAL_NUMBER, assetSlug);

  const { popup } = useAppEnv();

  const { publicKeyHash: accountAddress } = useAccount();

  useEffect(() => void dispatch(loadPartnersPromoAction.submit()), []);

  if (activities.length === 0 && !loading && reachedTheEnd) {
    return (
      <div className={classNames('mt-4 mb-12', 'flex flex-col items-center justify-center', 'text-gray-500')}>
        <PartnersPromotion variant={PartnersPromotionVariant.Image} />
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
      <div className={classNames('mt-3 flex flex-col', popup && 'mx-4')}>
        <InfiniteScroll
          dataLength={activities.length}
          hasMore={reachedTheEnd === false}
          next={loadNext}
          loader={loading && <ActivitySpinner height="2.5rem" />}
          onScroll={onScroll}
        >
          {activities.map((activity, index) => (
            <Fragment key={activity.hash}>
              <ActivityItem address={accountAddress} activity={activity} />
              {index === 0 && <PartnersPromotion variant={PartnersPromotionVariant.Image} />}
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
