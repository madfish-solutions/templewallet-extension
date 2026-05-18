import { FC, useMemo } from 'react';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { CrossChainActivityRow } from 'app/pages/Send/cross-chain/components/CrossChainActivityRow';
import { dispatch } from 'app/store';
import { putEvmNoCategoryAssetsMetadataAction } from 'app/store/evm/no-category-assets-metadata/actions';
import { EvmActivity } from 'lib/activity';
import { isEtherlinkSupportedChainId } from 'lib/apis/etherlink';
import { useAccount, useAccountAddressForEvm } from 'temple/front';
import { useEvmChainByChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { EvmActivityComponent } from './ActivityItem';
import { ActivityListView } from './ActivityListView';
import { fetchEtherlinkActivitiesWithCache, fetchEvmActivitiesWithCache } from './fetch-activities-with-cache';
import { ActivitiesDateGroup, useGroupingByDate } from './grouping-by-date';
import { RETRY_AFTER_ERROR_TIMEOUT, useActivitiesLoadingLogic } from './loading-logic';
import { useAssetsFromActivitiesCheck } from './use-assets-from-activites-check';
import { useInterleavedFeed } from './use-interleaved-feed';
import { FilterKind, getActivityFilterKind, getAllEtherlinkActivitiesPageParams } from './utils';

interface Props {
  chainId: number;
  assetSlug?: string;
  filterKind?: FilterKind;
  onCrossChainExchangeClick?: (id: string) => void;
}

export const EvmActivityList: FC<Props> = ({ chainId, assetSlug, filterKind, onCrossChainExchangeClick }) => {
  const currentAccount = useAccount();
  const network = useEvmChainByChainId(chainId);
  const accountAddress = useAccountAddressForEvm();

  if (!network || !accountAddress) throw new DeadEndBoundaryError();

  const { activities, isLoading, reachedTheEnd, error, loadNext } = useActivitiesLoadingLogic<EvmActivity>(
    async ({ setIsLoading, setActivities, setReachedTheEnd, setError }, activities, initial, signal) => {
      setIsLoading(true);

      const currActivities = initial ? [] : activities;

      const lastActivity = currActivities.at(-1);

      try {
        if (isEtherlinkSupportedChainId(chainId)) {
          const {
            activities: newActivities,
            assetsMetadata,
            reachedTheEnd
          } = await fetchEtherlinkActivitiesWithCache({
            chainId,
            accountAddress,
            assetSlug,
            signal,
            olderThan: getAllEtherlinkActivitiesPageParams(currActivities)
          });
          if (Object.keys(assetsMetadata).length) {
            dispatch(
              putEvmNoCategoryAssetsMetadataAction({
                records: {
                  [chainId]: assetsMetadata
                },
                associatedAccountPkh: accountAddress
              })
            );
          }

          if (newActivities.length) setActivities(currActivities.concat(newActivities));
          if (!newActivities.length || reachedTheEnd) setReachedTheEnd(true);
        } else {
          const { activities: newActivities } = await fetchEvmActivitiesWithCache({
            chainId,
            accountAddress,
            assetSlug,
            signal,
            olderThan: lastActivity?.blockHeight
          });

          if (newActivities.length) setActivities(currActivities.concat(newActivities));
          else setReachedTheEnd(true);
        }
      } catch (error) {
        if (signal.aborted) return;

        console.error(error);

        setError(error);

        setTimeout(() => {
          if (!signal.aborted) setError(null);
        }, RETRY_AFTER_ERROR_TIMEOUT);
      }

      setIsLoading(false);
    },
    [chainId, accountAddress, assetSlug]
  );

  const displayActivities = useMemo(
    () => (filterKind ? activities.filter(a => getActivityFilterKind(a) === filterKind) : activities),
    [activities, filterKind]
  );

  const feed = useInterleavedFeed({
    activities: displayActivities,
    remoteReachedTheEnd: reachedTheEnd,
    filterChain: { kind: TempleChainKind.EVM, chainId },
    accountId: currentAccount.id,
    enabled: Boolean(onCrossChainExchangeClick)
  });

  const groupedFeed = useGroupingByDate(feed);

  const contentJsx = useMemo(
    () =>
      groupedFeed.map(([dateStr, items]) => (
        <ActivitiesDateGroup key={dateStr} title={dateStr}>
          {items.map(item => {
            if (item.kind === 'evm') {
              return (
                <EvmActivityComponent key={item.data.hash} activity={item.data} chain={network} assetSlug={assetSlug} />
              );
            }
            if (item.kind === 'cross-chain') {
              return (
                <CrossChainActivityRow
                  key={item.data.id}
                  exchange={item.data}
                  onClick={() => onCrossChainExchangeClick?.(item.data.id)}
                />
              );
            }
            return null;
          })}
        </ActivitiesDateGroup>
      )),
    [groupedFeed, network, assetSlug, onCrossChainExchangeClick]
  );

  const evmAssetsCheckConfig = useMemo(
    () => ({
      activities: displayActivities,
      evmAccountPkh: accountAddress,
      mainAsset: assetSlug ? { chainKind: TempleChainKind.EVM, chainId, slug: assetSlug } : undefined
    }),
    [accountAddress, assetSlug, chainId, displayActivities]
  );
  useAssetsFromActivitiesCheck(evmAssetsCheckConfig);

  return (
    <ActivityListView
      activitiesNumber={feed.length}
      isSyncing={isLoading}
      reachedTheEnd={reachedTheEnd || Boolean(error)}
      loadNext={loadNext}
    >
      {contentJsx}
    </ActivityListView>
  );
};
