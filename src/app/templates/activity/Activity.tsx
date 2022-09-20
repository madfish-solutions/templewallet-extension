import React, { useMemo } from 'react';

import classNames from 'clsx';

import { ActivitySpinner } from 'app/atoms/ActivitySpinner';
import FormSecondaryButton from 'app/atoms/FormSecondaryButton';
import { ReactComponent as LayersIcon } from 'app/icons/layers.svg';
import { T } from 'lib/i18n/react';
import useActivities from 'lib/temple/activity-new/hook';
import { useChainId, useAccount } from 'lib/temple/front';
import { isKnownChainId } from 'lib/tzkt/api';

import ActivityItemComp from './ActivityItem';

////

const INIT_OPERS_N = 50;
const OPERS_LOAD_STEP = 50;

////

export default function ActivityComponent({ assetSlug }: { assetSlug?: string }) {
  const {
    loading,
    reachedTheEnd,
    list: activities,
    loadMore: loadMoreActivities
  } = useActivities(INIT_OPERS_N, assetSlug);

  const account = useAccount();
  const chainId = useChainId(true);
  const syncSupported = useMemo(() => isKnownChainId(chainId), [chainId]);

  const currentAccountAddress = account.publicKeyHash;

  function onLoadMoreBtnClick() {
    loadMoreActivities(OPERS_LOAD_STEP);
  }

  function onRetryLoadBtnClick() {
    loadMoreActivities(INIT_OPERS_N);
  }

  if (activities.length === 0) {
    if (loading) return <ActivitySpinner height="2.5rem" />;
    else if (reachedTheEnd === false)
      return (
        <div className="w-full flex justify-center mt-5 mb-3">
          <FormSecondaryButton onClick={onRetryLoadBtnClick} small>
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
          <ActivityItemComp
            key={activity.hash}
            address={currentAccountAddress}
            activity={activity}
            syncSupported={syncSupported}
          />
        ))}
      </div>

      {loading ? (
        <ActivitySpinner height="2.5rem" />
      ) : reachedTheEnd === false ? (
        <div className="w-full flex justify-center mt-5 mb-3">
          <FormSecondaryButton onClick={onLoadMoreBtnClick} small>
            <T id="loadMore" />
          </FormSecondaryButton>
        </div>
      ) : null}
    </>
  );
}
