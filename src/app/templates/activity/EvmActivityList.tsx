import React, { FC } from 'react';

import { AxiosError } from 'axios';

import { EmptyState } from 'app/atoms/EmptyState';
import { InfiniteScroll } from 'app/atoms/InfiniteScroll';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { useLoadPartnersPromo } from 'app/hooks/use-load-partners-promo';
import { EvmActivity } from 'lib/activity';
import { getEvmAssetTransactions } from 'lib/activity/evm';
import { useGetEvmChainAssetMetadata } from 'lib/metadata';
import { useDidMount, useDidUpdate, useSafeState, useStopper } from 'lib/ui/hooks';
import { useAccountAddressForEvm } from 'temple/front';
import { useEvmChainByChainId } from 'temple/front/chains';

import { EvmActivityComponent } from './ActivityItem';

interface Props {
  chainId: number;
  assetSlug?: string;
}

export const EvmActivityList: FC<Props> = ({ chainId, assetSlug }) => {
  const network = useEvmChainByChainId(chainId);
  const accountAddress = useAccountAddressForEvm();

  if (!network || !accountAddress) throw new DeadEndBoundaryError();

  useLoadPartnersPromo();

  const [isLoading, setIsLoading] = useSafeState(true);
  const [reachedTheEnd, setReachedTheEnd] = useSafeState(false);
  const [activities, setActivities] = useSafeState<EvmActivity[]>([]);
  const [nextPage, setNextPage] = useSafeState<number | nullish>(undefined);

  const { stop: stopLoading, stopAndBuildChecker } = useStopper();

  const getMetadata = useGetEvmChainAssetMetadata(chainId);

  const loadActivities = async (activities: EvmActivity[], shouldStop: () => boolean, page?: number) => {
    // if (isLoading) return;

    setIsLoading(true);

    let newActivities: EvmActivity[], newNextPage: number | null;
    try {
      const data = await getEvmAssetTransactions(accountAddress, chainId, getMetadata, assetSlug, page);

      newNextPage = data.nextPage;
      newActivities = data.activities;

      if (shouldStop()) return; // TODO: If so - save time on parsing then)
    } catch (error) {
      if (shouldStop()) return;
      setIsLoading(false);
      if (error instanceof AxiosError && error.status === 501) setReachedTheEnd(true);
      console.error(error);

      return;
    }

    setActivities(activities.concat(newActivities));
    setIsLoading(false);
    setNextPage(newNextPage);
    if (newNextPage === null || newActivities.length === 0) setReachedTheEnd(true);
  };

  /** Loads more of older items */
  function loadMore() {
    if (isLoading || reachedTheEnd || nextPage === null) return;
    loadActivities(activities, stopAndBuildChecker(), nextPage);
  }

  useDidMount(() => {
    loadActivities([], stopAndBuildChecker());

    return stopLoading;
  });

  useDidUpdate(() => {
    setActivities([]);
    setIsLoading(false);
    setReachedTheEnd(false);

    loadActivities([], stopAndBuildChecker());
  }, [chainId, accountAddress, assetSlug]);

  if (activities.length === 0 && !isLoading && reachedTheEnd) {
    return <EmptyState />;
  }

  return (
    <InfiniteScroll
      itemsLength={activities.length}
      isSyncing={isLoading}
      reachedTheEnd={reachedTheEnd}
      retryInitialLoad={loadMore}
      loadMore={loadMore}
    >
      {activities.map(activity => (
        <EvmActivityComponent key={activity.hash} activity={activity} chain={network} assetSlug={assetSlug} />
      ))}
    </InfiniteScroll>
  );
};
