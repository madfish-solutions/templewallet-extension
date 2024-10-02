import React, { FC } from 'react';

import { AxiosError } from 'axios';

import { EmptyState } from 'app/atoms/EmptyState';
import { InfiniteScroll } from 'app/atoms/InfiniteScroll';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { useLoadPartnersPromo } from 'app/hooks/use-load-partners-promo';
import { EvmActivity } from 'lib/activity';
import { getEvmAssetTransactions } from 'lib/activity/evm';
import { useGetEvmChainAssetMetadata } from 'lib/metadata';
import { useSafeState } from 'lib/ui/hooks';
import { useAccountAddressForEvm } from 'temple/front';
import { useEvmChainByChainId } from 'temple/front/chains';

import { EvmActivityComponent } from './ActivityItem';
import { useActivitiesLoadingLogic } from './loading-logic';

interface Props {
  chainId: number;
  assetSlug?: string;
}

export const EvmActivityList: FC<Props> = ({ chainId, assetSlug }) => {
  const network = useEvmChainByChainId(chainId);
  const accountAddress = useAccountAddressForEvm();

  if (!network || !accountAddress) throw new DeadEndBoundaryError();

  useLoadPartnersPromo();

  const [nextPage, setNextPage] = useSafeState<number | nullish>(undefined);

  const getMetadata = useGetEvmChainAssetMetadata(chainId);

  const { activities, isLoading, reachedTheEnd, setActivities, setIsLoading, setReachedTheEnd, loadNext } =
    useActivitiesLoadingLogic<EvmActivity>(
      async (initial, signal) => {
        const page = initial ? undefined : nextPage;
        if (page === null) return;

        const currActivities = initial ? [] : activities;

        setIsLoading(currActivities.length ? 'more' : 'init');

        try {
          const { activities: newActivities, nextPage: newNextPage } = await getEvmAssetTransactions(
            accountAddress,
            chainId,
            getMetadata,
            assetSlug,
            page,
            signal
          );

          if (signal.aborted) return;

          setActivities(currActivities.concat(newActivities));
          setNextPage(newNextPage);
          if (newNextPage === null || newActivities.length === 0) setReachedTheEnd(true);
        } catch (error) {
          if (signal.aborted) return;

          console.error(error);
          if (error instanceof AxiosError && error.status === 501) setReachedTheEnd(true);
        }

        setIsLoading(false);
      },
      [chainId, accountAddress, assetSlug],
      () => setNextPage(undefined)
    );

  if (activities.length === 0 && !isLoading && reachedTheEnd) {
    return <EmptyState />;
  }

  return (
    <InfiniteScroll
      itemsLength={activities.length}
      isSyncing={Boolean(isLoading)}
      reachedTheEnd={reachedTheEnd}
      retryInitialLoad={loadNext}
      loadMore={loadNext}
    >
      {activities.map(activity => (
        <EvmActivityComponent key={activity.hash} activity={activity} chain={network} assetSlug={assetSlug} />
      ))}
    </InfiniteScroll>
  );
};
