import React, { memo } from 'react';

import { EmptyState } from 'app/atoms/EmptyState';
import { InfiniteScroll } from 'app/atoms/InfiniteScroll';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { useLoadPartnersPromo } from 'app/hooks/use-load-partners-promo';
import useTezosActivities from 'lib/temple/activity-new/hook';
import { useAccountAddressForTezos, useTezosChainByChainId } from 'temple/front';

import { TezosActivityComponent } from './Activity';

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

  useLoadPartnersPromo();

  const {
    loading,
    reachedTheEnd,
    list: activities,
    loadMore
  } = useTezosActivities(network, accountAddress, INITIAL_NUMBER, assetSlug);

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
