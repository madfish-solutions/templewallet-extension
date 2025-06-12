import React, { FC, useMemo } from 'react';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { dispatch } from 'app/store';
import { putEvmNoCategoryAssetsMetadataAction } from 'app/store/evm/no-category-assets-metadata/actions';
import { EvmActivity } from 'lib/activity';
import { isEtherlinkSupportedChainId } from 'lib/apis/etherlink';
import { useAccountAddressForEvm } from 'temple/front';
import { useEvmChainByChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { EvmActivityComponent } from './ActivityItem';
import { ActivityListView } from './ActivityListView';
import { fetchEtherlinkActivitiesWithCache, fetchEvmActivitiesWithCache } from './fetch-activities-with-cache';
import { ActivitiesDateGroup, useGroupingByDate } from './grouping-by-date';
import { RETRY_AFTER_ERROR_TIMEOUT, useActivitiesLoadingLogic } from './loading-logic';
import { useAssetsFromActivitiesCheck } from './use-assets-from-activites-check';
import { FilterKind, getActivityFilterKind, getAllEtherlinkActivitiesPageParams } from './utils';

interface Props {
  chainId: number;
  assetSlug?: string;
  filterKind?: FilterKind;
}

export const EvmActivityList: FC<Props> = ({ chainId, assetSlug, filterKind }) => {
  const network = useEvmChainByChainId(chainId);
  const accountAddress = useAccountAddressForEvm();

  if (!network || !accountAddress) throw new DeadEndBoundaryError();

  const {
    activities,
    isLoading,
    reachedTheEnd,
    error,
    setActivities,
    setIsLoading,
    setReachedTheEnd,
    setError,
    loadNext
  } = useActivitiesLoadingLogic<EvmActivity>(
    async (initial, signal) => {
      setIsLoading(true);

      const currActivities = initial ? [] : activities;

      const lastActivity = currActivities.at(-1);

      try {
        if (isEtherlinkSupportedChainId(chainId)) {
          const {
            activities: newActivities,
            assetsMetadata,
            reachedTheEnd
          } = await fetchEtherlinkActivitiesWithCache({
            chainId,
            accountAddress,
            assetSlug,
            signal,
            olderThan: getAllEtherlinkActivitiesPageParams(currActivities)
          });
          if (Object.keys(assetsMetadata).length) {
            dispatch(
              putEvmNoCategoryAssetsMetadataAction({
                records: {
                  [chainId]: assetsMetadata
                },
                associatedAccountPkh: accountAddress
              })
            );
          }

          if (newActivities.length) setActivities(currActivities.concat(newActivities));
          if (!newActivities.length || reachedTheEnd) setReachedTheEnd(true);
        } else {
          const { activities: newActivities } = await fetchEvmActivitiesWithCache({
            chainId,
            accountAddress,
            assetSlug,
            signal,
            olderThan: lastActivity?.blockHeight
          });

          if (newActivities.length) setActivities(currActivities.concat(newActivities));
          else setReachedTheEnd(true);
        }
      } catch (error) {
        if (signal.aborted) return;

        console.error(error);

        setError(error);

        setTimeout(() => {
          if (!signal.aborted) setError(null);
        }, RETRY_AFTER_ERROR_TIMEOUT);
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

  const evmAssetsCheckConfig = useMemo(
    () => ({
      activities: displayActivities,
      evmAccountPkh: accountAddress,
      mainAsset: assetSlug ? { chainKind: TempleChainKind.EVM, chainId, slug: assetSlug } : undefined
    }),
    [accountAddress, assetSlug, chainId, displayActivities]
  );
  useAssetsFromActivitiesCheck(evmAssetsCheckConfig);

  return (
    <ActivityListView
      activitiesNumber={displayActivities.length}
      isSyncing={isLoading}
      reachedTheEnd={reachedTheEnd || Boolean(error)}
      loadNext={loadNext}
    >
      {contentJsx}
    </ActivityListView>
  );
};
