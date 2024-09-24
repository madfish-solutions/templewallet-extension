import React, { FC } from 'react';

import { AxiosError } from 'axios';

import { EmptyState } from 'app/atoms/EmptyState';
import { InfiniteScroll } from 'app/atoms/InfiniteScroll';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { useLoadPartnersPromo } from 'app/hooks/use-load-partners-promo';
import { EvmActivity, parseGoldRushTransaction, parseGoldRushERC20Transfer } from 'lib/activity';
import { getEvmERC20Transfers, getEvmTransactions } from 'lib/apis/temple/endpoints/evm';
import { fromAssetSlug } from 'lib/assets';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { EvmAssetMetadataGetter, useGetEvmAssetMetadata } from 'lib/metadata';
import { useDidMount, useDidUpdate, useSafeState, useStopper } from 'lib/ui/hooks';
import { useAccountAddressForEvm } from 'temple/front';
import { useEvmChainByChainId } from 'temple/front/chains';

import { EvmActivityComponent } from './ActivityItem';

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
  const [nextPage, setNextPage] = useSafeState<number | nullish>(undefined);

  const { stop: stopLoading, stopAndBuildChecker } = useStopper();

  const getMetadata = useGetEvmAssetMetadata(chainId);

  const loadActivities = async (activities: EvmActivity[], shouldStop: () => boolean, page?: number) => {
    // if (isLoading) return;

    setIsLoading(true);

    let newActivities: EvmActivity[], newNextPage: number | null;
    try {
      const data = await getEvmAssetTransactions(accountAddress, chainId, getMetadata, assetSlug, page);

      newNextPage = data.nextPage;
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

async function getEvmAssetTransactions(
  walletAddress: string,
  chainId: number,
  getMetadata: EvmAssetMetadataGetter,
  assetSlug?: string,
  page?: number
) {
  if (!assetSlug || assetSlug === EVM_TOKEN_SLUG) {
    const { items, nextPage } = await getEvmTransactions(walletAddress, chainId, page);

    return {
      activities: items.map<EvmActivity>(item => parseGoldRushTransaction(item, chainId, walletAddress, getMetadata)),
      nextPage
    };
  }

  const [contract] = fromAssetSlug(assetSlug);

  // let nextPage: number | nullish = page;

  // while (nextPage !== null) {
  //   const data = await getEvmTransactions(walletAddress, chainId, nextPage);

  //   const activities = data.items
  //     .map<EvmActivity>(item => parseGoldRushTransaction(item, chainId, walletAddress, getMetadata))
  //     .filter(a =>
  //       a.operations.some(
  //         ({ asset }) => asset && asset.contract === contract && (asset.tokenId == null || asset.tokenId === tokenId)
  //       )
  //     );

  //   if (activities.length) return { activities, nextPage: data.nextPage };

  //   nextPage = data.nextPage;
  // }

  // return { nextPage: null, activities: [] };

  const { items, nextPage } = await getEvmERC20Transfers(walletAddress, chainId, contract, page);

  return {
    activities: items.map<EvmActivity>(item => parseGoldRushERC20Transfer(item, chainId, walletAddress, getMetadata)),
    nextPage
  };
}
