import React, { FC, memo } from 'react';

import { AxiosError } from 'axios';

import { EmptyState } from 'app/atoms/EmptyState';
import { InfiniteScroll } from 'app/atoms/InfiniteScroll';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { useLoadPartnersPromo } from 'app/hooks/use-load-partners-promo';
import { ContentContainer } from 'app/layouts/containers';
import { useChainSelectController, ChainSelectSection } from 'app/templates/ChainSelect';
import { EvmActivity, parseGoldRushTransaction } from 'lib/activity';
import { getEvmTransactions } from 'lib/apis/temple/endpoints/evm';
import { useGetEvmAssetMetadata } from 'lib/metadata';
import useTezosActivities from 'lib/temple/activity-new/hook';
import { useDidMount, useDidUpdate, useSafeState, useStopper } from 'lib/ui/hooks';
import { useAccountAddressForEvm, useAccountAddressForTezos, useTezosChainByChainId } from 'temple/front';
import { useEvmChainByChainId } from 'temple/front/chains';

import { TezosActivityComponent, EvmActivityComponent } from './Activity';
import { ActivityTabContainer } from './ActivityTabContainer';

export const MultichainActivityTab = memo(() => {
  const chainSelectController = useChainSelectController();
  const network = chainSelectController.value;

  return (
    <>
      <div className="h-3" />

      <ContentContainer>
        <ChainSelectSection controller={chainSelectController} />

        <ActivityTabContainer chainId={network.chainId}>
          {network.kind === 'tezos' ? (
            <TezosActivityTab tezosChainId={network.chainId} />
          ) : (
            <EvmActivityTab chainId={network.chainId} />
          )}
        </ActivityTabContainer>
      </ContentContainer>
    </>
  );
});

const INITIAL_NUMBER = 30;
const LOAD_STEP = 30;

interface TezosActivityTabProps {
  tezosChainId: string;
  assetSlug?: string;
}

export const TezosActivityTab = memo<TezosActivityTabProps>(({ tezosChainId, assetSlug }) => {
  const network = useTezosChainByChainId(tezosChainId);
  const accountAddress = useAccountAddressForTezos();

  if (!network || !accountAddress) throw new DeadEndBoundaryError();

  const {
    loading,
    reachedTheEnd,
    list: activities,
    loadMore
  } = useTezosActivities(network, accountAddress, INITIAL_NUMBER, assetSlug);

  useLoadPartnersPromo();

  if (activities.length === 0 && !loading && reachedTheEnd) {
    return <EmptyState />;
  }

  return (
    <InfiniteScroll
      itemsLength={activities.length}
      isSyncing={Boolean(loading)}
      reachedTheEnd={reachedTheEnd}
      retryInitialLoad={() => loadMore(INITIAL_NUMBER)}
      loadMore={() => loadMore(LOAD_STEP)}
    >
      {activities.map(activity => (
        <TezosActivityComponent
          key={activity.hash}
          activity={activity}
          chain={network}
          accountAddress={accountAddress}
        />
      ))}
    </InfiniteScroll>
  );
});

interface EvmActivityTabProps {
  chainId: number;
  assetSlug?: string;
}

export const EvmActivityTab: FC<EvmActivityTabProps> = ({ chainId, assetSlug }) => {
  const network = useEvmChainByChainId(chainId);
  const accountAddress = useAccountAddressForEvm();

  if (!network || !accountAddress) throw new DeadEndBoundaryError();

  useLoadPartnersPromo();

  const [isLoading, setIsLoading] = useSafeState(true);
  const [reachedTheEnd, setReachedTheEnd] = useSafeState(false);
  const [activities, setActivities] = useSafeState<EvmActivity[]>([]);
  const [currentPage, setCurrentPage] = useSafeState<number | undefined>(undefined);

  const { stop: stopLoading, stopAndBuildChecker } = useStopper();

  const loadActivities = async (activities: EvmActivity[], shouldStop: () => boolean, page?: number) => {
    // if (isLoading) return;

    setIsLoading(true);

    let newActivities: EvmActivity[], newPage: number;
    try {
      const data = await getEvmTransactions(accountAddress, chainId, page);

      console.log('Data:', data);

      console.log(1, data?.items.length);
      console.log(2, new Set(data?.items.map(item => item.tx_hash)).size);

      newPage = data.current_page;

      newActivities =
        data?.items.map<EvmActivity>(item => parseGoldRushTransaction(item, chainId, accountAddress, getMetadata)) ??
        [];

      if (shouldStop()) return;
    } catch (error) {
      if (shouldStop()) return;
      setIsLoading(false);
      if (error instanceof AxiosError && error.status === 501) setReachedTheEnd(true);
      console.error(error);

      return;
    }

    setActivities(activities.concat(newActivities));
    setIsLoading(false);
    setCurrentPage(newPage);
    if (newPage <= 1 || newActivities.length === 0) setReachedTheEnd(true);
  };

  /** Loads more of older items */
  function loadMore() {
    if (isLoading || reachedTheEnd) return;
    loadActivities(activities, stopAndBuildChecker(), currentPage ? currentPage - 1 : undefined);
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

  const getMetadata = useGetEvmAssetMetadata(chainId);

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
        <EvmActivityComponent key={activity.hash} activity={activity} chain={network} />
      ))}
    </InfiniteScroll>
  );
};
