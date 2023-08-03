import React, { Fragment, useEffect } from 'react';

import classNames from 'clsx';
import { format, isSameDay } from 'date-fns';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useDispatch } from 'react-redux';

import { ActivitySpinner } from 'app/atoms';
import { PartnersPromotion, PartnersPromotionVariant } from 'app/atoms/partners-promotion';
import { useAppEnv } from 'app/env';
import { ReactComponent as LayersIcon } from 'app/icons/layers.svg';
import { loadPartnersPromoAction } from 'app/store/partners-promotion/actions';
import { OptimalPromoVariantEnum } from 'lib/apis/optimal';
import { getDateFnsLocale } from 'lib/i18n';
import { T } from 'lib/i18n/react';
import useActivities from 'lib/temple/activity-new/hook';
import { useAccount } from 'lib/temple/front';

import { useShouldShowPartnersPromoSelector } from '../../store/partners-promotion/selectors';
import { useIsEnabledAdsBannerSelector } from '../../store/settings/selectors';
import { ActivityItem } from './activity-item';

const INITIAL_NUMBER = 30;
const LOAD_STEP = 30;

interface Props {
  assetSlug?: string;
}

export const ActivityComponent: React.FC<Props> = ({ assetSlug }) => {
  const dispatch = useDispatch();
  const dateFnsLocale = getDateFnsLocale();

  const { loading, reachedTheEnd, groupedByDayActivities, loadMore } = useActivities(INITIAL_NUMBER, assetSlug);

  const { popup } = useAppEnv();

  const { publicKeyHash: accountAddress } = useAccount();

  const isShouldShowPartnersPromoState = useShouldShowPartnersPromoSelector();
  const isEnabledAdsBanner = useIsEnabledAdsBannerSelector();

  useEffect(() => {
    if (isShouldShowPartnersPromoState && !isEnabledAdsBanner) {
      dispatch(
        loadPartnersPromoAction.submit({
          optimalPromoVariantEnum: OptimalPromoVariantEnum.Fullview,
          accountAddress
        })
      );
    }
  }, [isShouldShowPartnersPromoState, isEnabledAdsBanner]);

  if (groupedByDayActivities.length === 0 && !loading && reachedTheEnd) {
    return (
      <div className={classNames('mt-4 mb-12', 'flex flex-col items-center justify-center', 'text-gray-500')}>
        <LayersIcon className="w-16 h-auto mb-2 stroke-current" />

        <h3 className="text-sm font-light text-center" style={{ maxWidth: '20rem' }}>
          <T id="noOperationsFound" />
        </h3>
      </div>
    );
  }

  const retryInitialLoad = () => loadMore(INITIAL_NUMBER);

  const loadMoreActivities = () => loadMore(LOAD_STEP);

  const loadNext = groupedByDayActivities.length === 0 ? retryInitialLoad : loadMoreActivities;

  const onScroll = loading || reachedTheEnd ? undefined : buildOnScroll(loadNext);

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className={classNames('mt-3 flex flex-col', popup && 'mx-4')}>
        <InfiniteScroll
          dataLength={groupedByDayActivities.length}
          hasMore={reachedTheEnd === false}
          next={loadNext}
          loader={loading && <ActivitySpinner height="2.5rem" />}
          onScroll={onScroll}
        >
          {groupedByDayActivities.map((activities, index) => (
            <Fragment key={activities[0].id}>
              <div className="w-full">
                <p className="pt-3 pb-1 text-sm text-gray-600 font-medium leading-tight">
                  {isSameDay(new Date(), new Date(activities[0].timestamp)) ? (
                    <T id="today" />
                  ) : (
                    format(new Date(activities[0].timestamp), 'd MMMM, yyyy', { locale: dateFnsLocale })
                  )}
                </p>
                {activities.map(activity => (
                  <ActivityItem activity={activity} key={activity.id} />
                ))}
              </div>
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
    const atBottom = elem.offsetHeight - elem.clientHeight - elem.scrollTop < 1;
    if (atBottom) next();
  };
