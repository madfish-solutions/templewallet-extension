import React, { FC, useMemo } from 'react';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { useLoadPartnersPromo } from 'app/hooks/use-load-partners-promo';
import { EvmActivity } from 'lib/activity';
import { getEvmActivities } from 'lib/activity/evm/fetch';
import { useAccountAddressForEvm } from 'temple/front';
import { useEvmChainByChainId } from 'temple/front/chains';

import { EvmActivityComponent } from './ActivityItem';
import { ActivityListView } from './ActivityListView';
import { ActivitiesDateGroup, useGroupingByDate } from './grouping-by-date';
import { useActivitiesLoadingLogic } from './loading-logic';
import { FilterKind, getActivityFilterKind } from './utils';

interface Props {
  chainId: number;
  assetSlug?: string;
  filterKind?: FilterKind;
}

export const EvmActivityList: FC<Props> = ({ chainId, assetSlug, filterKind }) => {
  const network = useEvmChainByChainId(chainId);
  const accountAddress = useAccountAddressForEvm();

  if (!network || !accountAddress) throw new DeadEndBoundaryError();

  useLoadPartnersPromo();

  const { activities, isLoading, reachedTheEnd, setActivities, setIsLoading, setReachedTheEnd, loadNext } =
    useActivitiesLoadingLogic<EvmActivity>(
      async (initial, signal) => {
        if (reachedTheEnd) return;

        setIsLoading(true);

        const currActivities = initial ? [] : activities;

        try {
          const olderThanBlockHeight = activities.at(activities.length - 1)?.blockHeight;

          const newActivities = await getEvmActivities(chainId, accountAddress, olderThanBlockHeight, signal);

          if (signal.aborted) return;

          setActivities(currActivities.concat(newActivities));
          if (newActivities.length === 0) setReachedTheEnd(true);
        } catch (error) {
          if (signal.aborted) return;

          console.error(error);
        }

        setIsLoading(false);
      },
      [chainId, accountAddress, assetSlug]
    );

  const displayActivities = useMemo(
    () => (filterKind ? activities.filter(a => getActivityFilterKind(a) === filterKind) : activities),
    [activities, filterKind]
  );

  const groupedActivities = useGroupingByDate(displayActivities);

  const contentJsx = useMemo(
    () =>
      groupedActivities.map(([dateStr, activities]) => (
        <ActivitiesDateGroup key={dateStr} title={dateStr}>
          {activities.map(activity => (
            <EvmActivityComponent key={activity.hash} activity={activity} chain={network} assetSlug={assetSlug} />
          ))}
        </ActivitiesDateGroup>
      )),
    [groupedActivities, network, assetSlug]
  );

  return (
    <ActivityListView
      activitiesNumber={displayActivities.length}
      isSyncing={isLoading}
      reachedTheEnd={reachedTheEnd}
      loadNext={loadNext}
    >
      {contentJsx}
    </ActivityListView>
  );
};
