import React, { FC } from 'react';

import { AxiosError } from 'axios';

import { EmptyState } from 'app/atoms/EmptyState';
import { InfiniteScroll } from 'app/atoms/InfiniteScroll';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { useLoadPartnersPromo } from 'app/hooks/use-load-partners-promo';
import { EvmActivity } from 'lib/activity';
import { getEvmAssetTransactions } from 'lib/activity/evm';
import { useGetEvmChainAssetMetadata } from 'lib/metadata';
import { useDidMount, useDidUpdate, useSafeState, useAbortSignal } from 'lib/ui/hooks';
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

  const { abort: abortLoading, abortAndRenewSignal } = useAbortSignal();

  const getMetadata = useGetEvmChainAssetMetadata(chainId);

  const loadActivities = async (activities: EvmActivity[], signal: AbortSignal, page?: number) => {
    // if (isLoading) return;

    setIsLoading(true);

    let newActivities: EvmActivity[], newNextPage: number | null;
    try {
      const data = await getEvmAssetTransactions(accountAddress, chainId, getMetadata, assetSlug, page, signal);

      newNextPage = data.nextPage;
      newActivities = data.activities;

      if (signal.aborted) return; // TODO: If so - save time on parsing then)
    } catch (error) {
      if (signal.aborted) return;
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
    loadActivities(activities, abortAndRenewSignal(), nextPage);
  }

  useDidMount(() => {
    loadActivities([], abortAndRenewSignal());

    return abortLoading;
  });

  useDidUpdate(() => {
    setActivities([]);
    setIsLoading(false);
    setReachedTheEnd(false);

    loadActivities([], abortAndRenewSignal());
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
