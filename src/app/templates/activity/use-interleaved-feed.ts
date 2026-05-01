import { useMemo } from 'react';

import { FilterChain } from 'app/store/assets-filter-options/state';
import { useCrossChainExchangesForAccountSelector } from 'app/store/cross-chain-send/selectors';
import { CrossChainExchange } from 'app/store/cross-chain-send/state';
import { Activity, EvmActivity, TezosActivity } from 'lib/activity';
import { TempleChainKind } from 'temple/types';

import { isTezosActivity } from './utils';

type FeedItem =
  | { kind: 'tezos'; addedAt: string; data: TezosActivity }
  | { kind: 'evm'; addedAt: string; data: EvmActivity }
  | { kind: 'cross-chain'; addedAt: string; data: CrossChainExchange };

interface FeedArgs {
  activities: Activity[];
  remoteReachedTheEnd: boolean;
  filterChain: FilterChain;
  accountId: string | undefined;
  /** When false, cross-chain exchanges are not merged into the feed */
  enabled: boolean;
}

const matchesFilter = (exchange: CrossChainExchange, filterChain: FilterChain): boolean => {
  if (!filterChain) return true;

  if (filterChain.kind === TempleChainKind.Tezos) {
    const sourceMatches =
      exchange.sourceChainKind === TempleChainKind.Tezos && String(exchange.sourceChainId) === filterChain.chainId;
    const destMatches =
      exchange.toAsset.chainKind === TempleChainKind.Tezos && String(exchange.toAsset.chainId) === filterChain.chainId;
    return sourceMatches || destMatches;
  }

  const sourceMatches =
    exchange.sourceChainKind === TempleChainKind.EVM && Number(exchange.sourceChainId) === filterChain.chainId;
  const destMatches =
    exchange.toAsset.chainKind === TempleChainKind.EVM && Number(exchange.toAsset.chainId) === filterChain.chainId;
  return sourceMatches || destMatches;
};

const dedupKey = (chainKind: TempleChainKind, chainId: string | number, hash: string) =>
  `${chainKind}:${chainId}:${hash.toLowerCase()}`;

/**
 * takes the currently loaded remote activity slice, the user's full local
 * cross-chain exchange list, and the active chain filter. Returns a sorted
 * feed item list.
 *
 * Remote activities whose source-chain tx hash matches a cross-chain exchange's
 * `sourceTxHash` are dropped so a single logical sending doesn't render twice.
 */
const buildInterleavedFeed = (
  activities: Activity[],
  exchanges: CrossChainExchange[],
  filterChain: FilterChain,
  remoteReachedTheEnd: boolean
): FeedItem[] => {
  const filtered = exchanges.filter(ex => matchesFilter(ex, filterChain));

  const sourceTxKeys = new Set(
    exchanges.filter(ex => ex.sourceTxHash).map(ex => dedupKey(ex.sourceChainKind, ex.sourceChainId, ex.sourceTxHash!))
  );

  const dedupedActivities = activities.filter(activity => {
    const key = isTezosActivity(activity)
      ? dedupKey(TempleChainKind.Tezos, activity.chainId, activity.hash)
      : dedupKey(TempleChainKind.EVM, activity.chainId, activity.hash);
    return !sourceTxKeys.has(key);
  });

  let injected: CrossChainExchange[];
  if (remoteReachedTheEnd) {
    injected = filtered;
  } else {
    const edgeAddedAt = activities.at(-1)?.addedAt;
    if (!edgeAddedAt) {
      injected = [];
    } else {
      injected = filtered.filter(ex => new Date(ex.createdAt).toISOString() >= edgeAddedAt);
    }
  }

  const remoteItems: FeedItem[] = dedupedActivities.map(activity =>
    isTezosActivity(activity)
      ? { kind: 'tezos', addedAt: activity.addedAt, data: activity }
      : { kind: 'evm', addedAt: activity.addedAt, data: activity }
  );

  const crossChainItems: FeedItem[] = injected.map(ex => ({
    kind: 'cross-chain',
    addedAt: new Date(ex.createdAt).toISOString(),
    data: ex
  }));

  return [...remoteItems, ...crossChainItems].sort((a, b) =>
    a.addedAt < b.addedAt ? 1 : a.addedAt > b.addedAt ? -1 : 0
  );
};

export const useInterleavedFeed = ({
  activities,
  remoteReachedTheEnd,
  filterChain,
  accountId,
  enabled
}: FeedArgs): FeedItem[] => {
  const exchanges = useCrossChainExchangesForAccountSelector(accountId);

  return useMemo(
    () => buildInterleavedFeed(activities, enabled ? exchanges : [], filterChain, remoteReachedTheEnd),
    [activities, exchanges, filterChain, remoteReachedTheEnd, enabled]
  );
};
