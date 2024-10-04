import React, { memo, useMemo } from 'react';

import { EmptyState } from 'app/atoms/EmptyState';
import { InfiniteScroll } from 'app/atoms/InfiniteScroll';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { useLoadPartnersPromo } from 'app/hooks/use-load-partners-promo';
import { TezosActivity } from 'lib/activity';
import { parseTezosOperationsGroup } from 'lib/activity/tezos';
import fetchTezosOperationsGroups from 'lib/activity/tezos/fetch';
import { isKnownChainId } from 'lib/apis/tzkt/api';
import { useAccountAddressForTezos, useTezosChainByChainId } from 'temple/front';

import { TezosActivityComponent } from './ActivityItem';
import { useActivitiesLoadingLogic } from './loading-logic';
import { FilterKind, getActivityFilterKind } from './utils';

interface Props {
  tezosChainId: string;
  assetSlug?: string;
  filterKind: FilterKind;
}

export const TezosActivityList = memo<Props>(({ tezosChainId, assetSlug, filterKind }) => {
  const network = useTezosChainByChainId(tezosChainId);
  const accountAddress = useAccountAddressForTezos();

  if (!network || !accountAddress) throw new DeadEndBoundaryError();

  useLoadPartnersPromo();

  const { chainId, rpcBaseURL } = network;

  const { activities, isLoading, reachedTheEnd, setActivities, setIsLoading, setReachedTheEnd, loadNext } =
    useActivitiesLoadingLogic<TezosActivity>(
      async (initial, signal) => {
        if (!isKnownChainId(chainId)) {
          setIsLoading(false);
          setReachedTheEnd(true);
          return;
        }

        setIsLoading(true);

        const currActivities = initial ? [] : activities;

        const olderThan = currActivities.at(-1);

        try {
          const groups = await fetchTezosOperationsGroups(chainId, rpcBaseURL, accountAddress, assetSlug, olderThan);

          if (signal.aborted) return;

          const newActivities = groups.map(group => parseTezosOperationsGroup(group, chainId, accountAddress));

          setActivities(currActivities.concat(newActivities));
          if (newActivities.length === 0) setReachedTheEnd(true);
        } catch (error) {
          if (signal.aborted) return;

          console.error(error);
        }

        setIsLoading(false);
      },
      [chainId, accountAddress, assetSlug],
      undefined,
      isKnownChainId(chainId)
    );

  const displayActivities = useMemo(
    () => (filterKind ? activities.filter(act => getActivityFilterKind(act) === filterKind) : activities),
    [activities, filterKind]
  );

  if (displayActivities.length === 0 && !isLoading && reachedTheEnd) {
    return <EmptyState />;
  }

  return (
    <InfiniteScroll
      itemsLength={displayActivities.length}
      isSyncing={isLoading}
      reachedTheEnd={reachedTheEnd}
      retryInitialLoad={loadNext}
      loadMore={loadNext}
    >
      {displayActivities.map(activity => (
        <TezosActivityComponent key={activity.hash} activity={activity} chain={network} assetSlug={assetSlug} />
      ))}
    </InfiniteScroll>
  );
});
