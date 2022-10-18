import React, { memo } from 'react';

import classNames from 'clsx';

import { FormSecondaryButton, ActivitySpinner } from 'app/atoms';
import { useAppEnv } from 'app/env';
import { ReactComponent as LayersIcon } from 'app/icons/layers.svg';
import { T } from 'lib/i18n';
import * as Repo from 'lib/temple/repo';

import ActivityItem from './ActivityItem';

type ActivityViewProps = {
  address: string;
  syncSupported: boolean;
  operations: Repo.IOperation[];
  initialLoading: boolean;
  loadingMore: boolean;
  syncing: boolean;
  loadMoreDisplayed: boolean;
  loadMore: () => void;
  className?: string;
};

const ActivityView = memo<ActivityViewProps>(
  ({ address, syncSupported, operations, initialLoading, loadingMore, loadMoreDisplayed, loadMore, className }) => {
    const noOperations = operations.length === 0;
    const { popup } = useAppEnv();

    if (noOperations) {
      return initialLoading ? (
        <ActivitySpinner height="2.5rem" />
      ) : (
        <div
          className={classNames(
            'mt-4 mb-12',
            'flex flex-col items-center justify-center',
            'text-gray-500',
            popup && 'mx-4'
          )}
        >
          <LayersIcon className="w-16 h-auto mb-2 stroke-current" />

          <h3 className="text-sm font-light text-center" style={{ maxWidth: '20rem' }}>
            <T id="noOperationsFound" />
          </h3>
        </div>
      );
    }

    return (
      <div className={classNames(popup && 'mx-4')}>
        <div className={classNames('w-full max-w-sm mx-auto', 'flex flex-col', className)}>
          {operations?.map(op => (
            <ActivityItem key={op.hash} address={address} operation={op} syncSupported={syncSupported} />
          ))}
        </div>

        {loadingMore ? (
          <ActivitySpinner height="2.5rem" />
        ) : (
          <div className="w-full flex justify-center mt-5 mb-3">
            <FormSecondaryButton disabled={!loadMoreDisplayed} onClick={loadMore} small>
              <T id="loadMore" />
            </FormSecondaryButton>
          </div>
        )}
      </div>
    );
  }
);

export default ActivityView;
