import React, { FC } from 'react';

import { AxiosError } from 'axios';

import { EmptyState } from 'app/atoms/EmptyState';
import { InfiniteScroll } from 'app/atoms/InfiniteScroll';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { useLoadPartnersPromo } from 'app/hooks/use-load-partners-promo';
import { EvmActivity, parseGoldRushTransaction } from 'lib/activity';
import { getEvmTransactions } from 'lib/apis/temple/endpoints/evm';
import { fromAssetSlug } from 'lib/assets';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { EvmAssetMetadataGetter, useGetEvmAssetMetadata } from 'lib/metadata';
import { useDidMount, useDidUpdate, useSafeState, useStopper } from 'lib/ui/hooks';
import { useAccountAddressForEvm } from 'temple/front';
import { useEvmChainByChainId } from 'temple/front/chains';

import { EvmActivityComponent } from './Activity';
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

  const getMetadata = useGetEvmAssetMetadata(chainId);

  const loadActivities = async (activities: EvmActivity[], shouldStop: () => boolean, page?: number) => {
    // if (isLoading) return;

    setIsLoading(true);

    let newActivities: EvmActivity[], newPage: number;
    try {
      // const data = await getEvmTransactions(accountAddress, chainId, page);

      // console.log('Data:', data);

      // console.log(1, data?.items.length);
      // console.log(2, new Set(data?.items.map(item => item.tx_hash)).size);

      // newPage = data.current_page;

      // newActivities = data.items.map<EvmActivity>(item =>
      //   parseGoldRushTransaction(item, chainId, accountAddress, getMetadata)
      // );

      const data = await getEvmAssetTransactions(accountAddress, chainId, getMetadata, assetSlug, page);

      newPage = data.page;
      newActivities = data.activities;

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

async function getEvmAssetTransactions(
  walletAddress: string,
  chainId: number,
  getMetadata: EvmAssetMetadataGetter,
  assetSlug?: string,
  page?: number
) {
  if (!assetSlug || assetSlug === EVM_TOKEN_SLUG) {
    const { items, current_page } = await getEvmTransactions(walletAddress, chainId, page);

    return {
      activities: items.map<EvmActivity>(item => parseGoldRushTransaction(item, chainId, walletAddress, getMetadata)),
      page: current_page
    };
  }

  const [contract, tokenId] = fromAssetSlug(assetSlug);

  let nextPage = page;

  while (nextPage == null || nextPage > 0) {
    const data = await getEvmTransactions(walletAddress, chainId, nextPage);

    const newPage = data.current_page;

    const activities = data.items
      .map<EvmActivity>(item => parseGoldRushTransaction(item, chainId, walletAddress, getMetadata))
      .filter(a =>
        a.operations.some(
          ({ asset }) => asset && asset.contract === contract && (asset.tokenId == null || asset.tokenId === tokenId)
        )
      );

    if (activities.length || newPage <= 1) return { activities, page: newPage };

    nextPage = newPage - 1;
  }

  return { page: 1, activities: [] };
}
