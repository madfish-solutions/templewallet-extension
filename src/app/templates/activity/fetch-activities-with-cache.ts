import { EvmActivity, TezosActivity } from 'lib/activity';
import { getEvmActivities } from 'lib/activity/evm/fetch';
import { parseTezosOperationsGroup } from 'lib/activity/tezos';
import { fetchOperGroupsForOperations, fetchOperations } from 'lib/activity/tezos/fetch';
import { TezosActivityOlderThan } from 'lib/activity/tezos/types';
import { fromAssetSlug } from 'lib/assets';
import {
  GetEvmActivitiesIntervalResult,
  GetTezosActivitiesIntervalResult,
  compareTezosIntervalLimits,
  getClosestEvmActivitiesInterval,
  getClosestTezosActivitiesInterval,
  tezosLowestIntervalLimit,
  putEvmActivities,
  putTezosActivities,
  getSeparateActivities
} from 'lib/temple/activity/repo';
import { TempleTezosChainId } from 'lib/temple/types';
import { filterUnique } from 'lib/utils';

interface FetchActivitiesWithCacheConfig<P, I, A> {
  getClosestActivitiesInterval: (olderThan: P) => Promise<I | undefined>;
  fetchActivities: (olderThan?: P) => Promise<A[]>;
  isGenesisBlockPointer: (pointer: P) => boolean;
  getActivities: (interval: I) => A[];
  getNewOlderThan: (interval: I) => P;
  canUseCachedInterval: (interval: I, olderThan: P) => boolean;
  putNewActivities: (activities: A[], olderThan?: P) => Promise<void>;
  signal: AbortSignal;
  olderThan?: P;
}

const fetchActivitiesWithCache = async <P, I, A>({
  getClosestActivitiesInterval,
  fetchActivities,
  isGenesisBlockPointer,
  getActivities,
  getNewOlderThan,
  canUseCachedInterval,
  putNewActivities,
  signal,
  olderThan
}: FetchActivitiesWithCacheConfig<P, I, A>) => {
  let currentOlderThan = olderThan;
  let newActivities: A[] | undefined;

  if (currentOlderThan) {
    do {
      try {
        const activitiesInterval = await getClosestActivitiesInterval(currentOlderThan);

        signal.throwIfAborted();

        if (activitiesInterval && canUseCachedInterval(activitiesInterval, currentOlderThan)) {
          newActivities = getActivities(activitiesInterval);
          currentOlderThan = getNewOlderThan(activitiesInterval);
        } else {
          newActivities = undefined;
        }
      } catch (e) {
        console.error(e);
        newActivities = undefined;
      }
    } while (newActivities?.length === 0 && !isGenesisBlockPointer(currentOlderThan));

    if (isGenesisBlockPointer(currentOlderThan)) {
      newActivities = [];
    }
  }

  if (!newActivities) {
    newActivities = await fetchActivities(currentOlderThan);
    try {
      await putNewActivities(newActivities, currentOlderThan);
    } catch (e) {
      console.error(e);
    }
  }

  signal.throwIfAborted();

  return newActivities;
};

interface FetchEvmActivitiesWithCacheConfig {
  chainId: number;
  accountAddress: HexString;
  assetSlug?: string;
  signal: AbortSignal;
  olderThan?: `${number}`;
}

export const fetchEvmActivitiesWithCache = async ({
  chainId,
  accountAddress,
  assetSlug,
  signal,
  olderThan
}: FetchEvmActivitiesWithCacheConfig) => {
  const contractAddress = assetSlug ? fromAssetSlug(assetSlug)[0] : undefined;

  return fetchActivitiesWithCache<`${number}`, GetEvmActivitiesIntervalResult, EvmActivity>({
    getClosestActivitiesInterval: currentOlderThan =>
      getClosestEvmActivitiesInterval({
        olderThanBlockHeight: currentOlderThan,
        chainId,
        account: accountAddress,
        contractAddress,
        maxItems: 50
      }),
    fetchActivities: currentOlderThan => getEvmActivities(chainId, accountAddress, assetSlug, currentOlderThan, signal),
    isGenesisBlockPointer: pointer => Number(pointer) === 0,
    getActivities: interval => interval.activities,
    getNewOlderThan: interval => `${interval.oldestBlockHeight}`,
    canUseCachedInterval: (interval, currentOlderThan) => interval.newestBlockHeight === Number(currentOlderThan) - 1,
    putNewActivities: (activities, currentOlderThan) =>
      putEvmActivities({
        activities,
        chainId,
        account: accountAddress,
        contractAddress,
        olderThanBlockHeight: currentOlderThan
      }),
    signal,
    olderThan
  });
};

interface FetchTezosActivitiesWithCacheConfig {
  chainId: TempleTezosChainId;
  rpcBaseURL: string;
  accountAddress: string;
  assetSlug?: string;
  signal: AbortSignal;
  olderThan?: TezosActivityOlderThan;
}

const TEZOS_ACTIVITIES_PSEUDO_LIMIT = 30;
export const fetchTezosActivitiesWithCache = async ({
  chainId,
  rpcBaseURL,
  accountAddress,
  assetSlug,
  signal,
  olderThan
}: FetchTezosActivitiesWithCacheConfig) =>
  fetchActivitiesWithCache<TezosActivityOlderThan, GetTezosActivitiesIntervalResult, TezosActivity>({
    getClosestActivitiesInterval: currentOlderThan =>
      getClosestTezosActivitiesInterval({
        olderThan: currentOlderThan,
        chainId,
        account: accountAddress,
        assetSlug,
        maxItems: TEZOS_ACTIVITIES_PSEUDO_LIMIT
      }),
    fetchActivities: async currentOlderThan => {
      const operations = await fetchOperations(
        chainId,
        rpcBaseURL,
        accountAddress,
        assetSlug,
        TEZOS_ACTIVITIES_PSEUDO_LIMIT,
        olderThan
      );
      const hashes = filterUnique(operations.map(({ hash }) => hash));
      const alreadyKnownActivities = await getSeparateActivities(chainId, accountAddress, hashes);
      const alreadyKnownActivitiesByHashes = Object.fromEntries(
        alreadyKnownActivities.map(activity => [activity.hash, activity])
      );

      const newHashes = hashes.filter(hash => !alreadyKnownActivitiesByHashes[hash]);
      const newGroups = await fetchOperGroupsForOperations(chainId, newHashes, currentOlderThan);
      const newActivitiesByHashes = Object.fromEntries(
        newGroups.map(group => [group.hash, parseTezosOperationsGroup(group, chainId, accountAddress)])
      );

      return hashes.map(hash => alreadyKnownActivitiesByHashes[hash] ?? newActivitiesByHashes[hash]);
    },
    isGenesisBlockPointer: pointer => compareTezosIntervalLimits(tezosLowestIntervalLimit, pointer) === 0,
    getActivities: interval => interval.activities,
    getNewOlderThan: interval => interval.lowerLimit,
    canUseCachedInterval: (interval, currentOlderThan) =>
      compareTezosIntervalLimits(interval.upperLimit, currentOlderThan) === 0,
    putNewActivities: (activities, currentOlderThan) =>
      putTezosActivities({ activities, chainId, account: accountAddress, assetSlug, olderThan: currentOlderThan }),
    signal,
    olderThan
  });
