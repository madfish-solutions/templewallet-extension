import React, { memo, FC, useMemo } from 'react';

import clsx from 'clsx';
import InfiniteScroll from 'react-infinite-scroll-component';

import { SyncSpinner } from 'app/atoms';
import { SuspenseContainer } from 'app/atoms/SuspenseContainer';
import { useAppEnv } from 'app/env';
import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { useLoadPartnersPromo } from 'app/hooks/use-load-partners-promo';
import { ReactComponent as LayersIcon } from 'app/icons/layers.svg';
import { ContentContainer } from 'app/layouts/containers';
import { useChainSelectController, ChainSelectSection } from 'app/templates/ChainSelect';
import { PartnersPromotion, PartnersPromotionVariant } from 'app/templates/partners-promotion';
import { t, T } from 'lib/i18n/react';
import useTezosActivities from 'lib/temple/activity-new/hook';
import { UNDER_DEVELOPMENT_MSG } from 'temple/evm/under_dev_msg';
import { useAccountAddressForTezos, useTezosChainByChainId } from 'temple/front';

import { ActivityItem } from './ActivityItem';

const INITIAL_NUMBER = 30;
const LOAD_STEP = 30;

interface Props {
  tezosChainId?: string;
  assetSlug?: string;
}

export const ActivityTab = memo<Props>(({ tezosChainId, assetSlug }) => (
  <SuspenseContainer errorMessage={t('operationHistoryWhileMessage')}>
    {tezosChainId ? <TezosActivity tezosChainId={tezosChainId} assetSlug={assetSlug} /> : <ActivityWithChainSelect />}
  </SuspenseContainer>
));

const ActivityWithChainSelect = memo(() => {
  const chainSelectController = useChainSelectController();
  const network = chainSelectController.value;

  return (
    <>
      <div className="h-3" />

      <ContentContainer>
        <ChainSelectSection controller={chainSelectController} />

        {network.kind === 'tezos' ? (
          <TezosActivity tezosChainId={network.chainId} />
        ) : (
          <div className="py-3 text-center">{UNDER_DEVELOPMENT_MSG}</div>
        )}
      </ContentContainer>
    </>
  );
});

interface TezosActivityProps {
  tezosChainId: string;
  assetSlug?: string;
}

const TezosActivity: FC<TezosActivityProps> = ({ tezosChainId, assetSlug }) => {
  const network = useTezosChainByChainId(tezosChainId);
  const accountAddress = useAccountAddressForTezos();
  if (!network || !accountAddress) throw new DeadEndBoundaryError();

  const {
    loading,
    reachedTheEnd,
    list: activities,
    loadMore
  } = useTezosActivities(network, accountAddress, INITIAL_NUMBER, assetSlug);

  const { popup } = useAppEnv();

  useLoadPartnersPromo();

  const promotion = useMemo(() => {
    const promotionId = `promo-activity-${assetSlug ?? 'all'}`;

    return (
      <PartnersPromotion
        id={promotionId}
        variant={PartnersPromotionVariant.Image}
        pageName="Activity"
        withPersonaProvider
      />
    );
  }, [assetSlug]);

  if (activities.length === 0 && !loading && reachedTheEnd) {
    return (
      <div className={clsx('mt-3 mb-12 text-gray-500', 'flex flex-col items-center justify-center')}>
        <div className="w-full flex justify-center mb-6">{promotion}</div>

        <LayersIcon className="w-16 h-auto mb-2 stroke-current" />

        <h3 className="text-sm font-light text-center" style={{ maxWidth: '20rem' }}>
          <T id="noOperationsFound" />
        </h3>
      </div>
    );
  }

  const retryInitialLoad = () => loadMore(INITIAL_NUMBER);
  const loadMoreActivities = () => loadMore(LOAD_STEP);

  const loadNext = activities.length === 0 ? retryInitialLoad : loadMoreActivities;

  const onScroll = loading || reachedTheEnd ? undefined : buildOnScroll(loadNext);

  return (
    <div className={clsx('my-3 flex flex-col', popup && 'mx-4')}>
      <div className="w-full mb-4 flex justify-center">{promotion}</div>

      <InfiniteScroll
        dataLength={activities.length}
        hasMore={reachedTheEnd === false}
        next={loadNext}
        loader={loading && <SyncSpinner className="mt-4" />}
        onScroll={onScroll}
      >
        {activities.map(activity => (
          <ActivityItem
            key={activity.hash}
            activity={activity}
            tezosChainId={network.chainId}
            address={accountAddress}
          />
        ))}
      </InfiniteScroll>
    </div>
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
