import React, { FC, memo } from 'react';

import InfiniteScroll from 'react-infinite-scroll-component';

import { SyncSpinner } from 'app/atoms';
import { EmptyState } from 'app/atoms/EmptyState';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { useLoadPartnersPromo } from 'app/hooks/use-load-partners-promo';
import { APP_CONTENT_PAPER_DOM_ID, ContentContainer, SCROLL_DOCUMENT } from 'app/layouts/containers';
import { useChainSelectController, ChainSelectSection } from 'app/templates/ChainSelect';
import { EvmActivity, parseGoldRushTransaction } from 'lib/activity';
import { getEvmTransactions } from 'lib/apis/temple/endpoints/evm';
import { useGetEvmAssetMetadata } from 'lib/metadata';
import { useTypedSWR } from 'lib/swr';
import useTezosActivities from 'lib/temple/activity-new/hook';
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

  const retryInitialLoad = () => loadMore(INITIAL_NUMBER);
  const loadMoreActivities = () => loadMore(LOAD_STEP);

  const loadNext = activities.length === 0 ? retryInitialLoad : loadMoreActivities;

  const onScroll = loading || reachedTheEnd ? undefined : buildOnScroll(loadNext);

  return (
    <InfiniteScroll
      dataLength={activities.length}
      hasMore={reachedTheEnd === false}
      next={loadNext}
      loader={loading && <SyncSpinner className="mt-4" />}
      onScroll={onScroll}
      scrollableTarget={SCROLL_DOCUMENT ? undefined : APP_CONTENT_PAPER_DOM_ID}
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

  const getMetadata = useGetEvmAssetMetadata(chainId);

  const { data: activities = [], isLoading: isSyncing } = useTypedSWR(
    ['evm-activity-history', chainId, accountAddress],
    async () => {
      const data = await getEvmTransactions(accountAddress, chainId, 0);

      console.log('Data:', data);

      console.log(1, data?.items.length);
      console.log(2, new Set(data?.items.map(item => item.tx_hash)).size);

      const activities =
        data?.items.map<EvmActivity>(item => parseGoldRushTransaction(item, chainId, accountAddress, getMetadata)) ??
        [];

      return activities;
    }
  );

  return activities.length ? (
    <>
      {activities.map(activity => (
        <EvmActivityComponent key={activity.hash} activity={activity} chain={network} />
      ))}

      {isSyncing && <SyncSpinner className="mt-4" />}
    </>
  ) : isSyncing ? (
    <SyncSpinner className="mt-4" />
  ) : (
    <EmptyState />
  );
};

/**
 * Build onscroll listener to trigger next loading, when fetching data resulted in error.
 * `InfiniteScroll.props.next` won't be triggered in this case.
 */
const buildOnScroll =
  (next: EmptyFn) =>
  ({ target }: { target: EventTarget | null }) => {
    const elem: HTMLElement =
      target instanceof Document ? (target.scrollingElement! as HTMLElement) : (target as HTMLElement);
    const atBottom = 0 === elem.offsetHeight - elem.clientHeight - elem.scrollTop;
    if (atBottom) next();
  };
