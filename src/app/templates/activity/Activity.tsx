import React from 'react';

import classNames from 'clsx';

import { FormSecondaryButton } from 'app/atoms';
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
  const {
    loading,
    reachedTheEnd,
    list: activities,
    loadMore: loadMoreActivities
  } = useActivities(INITIAL_NUMBER, assetSlug);

  const { publicKeyHash: accountAddress } = useAccount();

  const onLoadMoreButtonClick = () => loadMoreActivities(LOAD_STEP);
  const onRetryLoadButtonClick = () => loadMoreActivities(INITIAL_NUMBER);

  if (activities.length === 0) {
    if (loading) return <ActivitySpinner height="2.5rem" />;
    else if (reachedTheEnd === false)
      return (
        <div className="w-full flex justify-center mt-5 mb-3">
          <FormSecondaryButton onClick={onRetryLoadButtonClick} small>
            <T id="tryLoadAgain" />
          </FormSecondaryButton>
        </div>
      );

    return (
      <div className={classNames('mt-4 mb-12', 'flex flex-col items-center justify-center', 'text-gray-500')}>
        <LayersIcon className="w-16 h-auto mb-2 stroke-current" />

        <h3 className="text-sm font-light text-center" style={{ maxWidth: '20rem' }}>
          <T id="noOperationsFound" />
        </h3>
      </div>
    );
  }

  return (
    <>
      <div className={classNames('w-full max-w-md mx-auto', 'flex flex-col')}>
        {activities.map(activity => (
          <ActivityItem key={activity.hash} address={accountAddress} activity={activity} />
        ))}
      </div>

      {loading ? (
        <ActivitySpinner height="2.5rem" />
      ) : reachedTheEnd === false ? (
        <div className="w-full flex justify-center mt-5 mb-3">
          <FormSecondaryButton onClick={onLoadMoreButtonClick} small>
            <T id="loadMore" />
          </FormSecondaryButton>
        </div>
      ) : null}
    </>
  );
};
