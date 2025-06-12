import { isDefined } from '@rnw-community/shared';

import { EvmActivity, TezosActivity } from 'lib/activity';
import { getEvmActivities } from 'lib/activity/evm/fetch';
import { parseTezosOperationsGroup } from 'lib/activity/tezos';
import { fetchOperGroupsForOperations, fetchOperations } from 'lib/activity/tezos/fetch';
import { TezosActivityOlderThan } from 'lib/activity/tezos/types';
import { EtherlinkChainId } from 'lib/apis/etherlink';
import { fromAssetSlug } from 'lib/assets';
import { equalsIgnoreCase } from 'lib/evm/on-chain/utils/common.utils';
import { EvmCollectibleMetadata, EvmTokenMetadata } from 'lib/metadata/types';
import {
  GetEvmActivitiesIntervalResult,
  GetTezosActivitiesIntervalResult,
  compareTezosIntervalLimits,
  getClosestEvmActivitiesInterval,
  getClosestTezosActivitiesInterval,
  tezosLowestIntervalLimit,
  putEvmActivities,
  putTezosActivities,
  getSeparateTezosActivities
} from 'lib/temple/activity/repo';
import { TempleTezosChainId } from 'lib/temple/types';
import { filterUnique } from 'lib/utils';

import {
  AllEtherlinkActivitiesPageParams,
  ETHERLINK_ITEMS_PER_PAGE,
  fetchEtherlinkActivities,
  getBlockNumberFromEtherlinkOlderThan
} from './utils';

export { type AllEtherlinkActivitiesPageParams } from './utils';

interface GetClosestNonEmptyActivitiesIntervalConfig<P, I, A> {
  getClosestActivitiesInterval: (olderThan: P | undefined) => Promise<I | undefined>;
  isGenesisBlockPointer: SyncFn<P, boolean>;
  getActivities: SyncFn<I, A[]>;
  getNewOlderThan: SyncFn<I, P>;
  canUseCachedInterval: (interval: I, olderThan: P) => boolean;
  signal: AbortSignal;
  olderThan?: P;
}

interface FetchActivitiesWithCacheConfig<P, I, A, M = never, R = A[]>
  extends GetClosestNonEmptyActivitiesIntervalConfig<P, I, A> {
  fetchActivities: (olderThan?: P) => Promise<R>;
  getNewContractMatchItems: SyncFn<R, A[]>;
  getAllNewItems?: SyncFn<R, A[]>;
  /** A function for assets metadata that are the side product of fetching activities */
  getAssetsMetadata?: SyncFn<R, StringRecord<M>>;
  getReachedTheEnd?: SyncFn<R, boolean>;
  putNewActivities: (contractMatchActivities: A[], allActivities: A[], olderThan?: P) => Promise<void>;
}

const getClosestNonEmptyActivitiesInterval = async <P, I, A>({
  olderThan,
  getClosestActivitiesInterval,
  signal,
  canUseCachedInterval,
  getActivities,
  getNewOlderThan,
  isGenesisBlockPointer
}: GetClosestNonEmptyActivitiesIntervalConfig<P, I, A>) => {
  let currentOlderThan = olderThan;
  let newActivities: A[] | undefined;
  do {
    try {
      const activitiesInterval = await getClosestActivitiesInterval(currentOlderThan);

      signal.throwIfAborted();

      if (activitiesInterval && (!currentOlderThan || canUseCachedInterval(activitiesInterval, currentOlderThan))) {
        newActivities = getActivities(activitiesInterval);
        currentOlderThan = getNewOlderThan(activitiesInterval);
      } else {
        newActivities = undefined;
      }
    } catch (e) {
      console.error(e);
      newActivities = undefined;
    }
  } while (newActivities?.length === 0 && (!currentOlderThan || !isGenesisBlockPointer(currentOlderThan)));

  if (currentOlderThan && isGenesisBlockPointer(currentOlderThan)) {
    newActivities = [];
  }

  return { currentOlderThan, newActivities };
};
const fetchActivitiesWithCache = async <P, I, A, M = never, R = A[]>({
  getClosestActivitiesInterval,
  fetchActivities,
  getNewContractMatchItems,
  getAllNewItems = getNewContractMatchItems,
  getAssetsMetadata,
  getReachedTheEnd,
  isGenesisBlockPointer,
  getActivities,
  getNewOlderThan,
  canUseCachedInterval,
  putNewActivities,
  signal,
  olderThan
}: FetchActivitiesWithCacheConfig<P, I, A, M, R>) => {
  let currentOlderThan = olderThan;
  let assetsMetadata: StringRecord<M> = {};

  let activitiesFromCache: A[] | undefined;
  if (olderThan) {
    const getIntervalResults = await getClosestNonEmptyActivitiesInterval({
      olderThan,
      getClosestActivitiesInterval,
      signal,
      canUseCachedInterval,
      getActivities,
      getNewOlderThan,
      isGenesisBlockPointer
    });
    currentOlderThan = getIntervalResults.currentOlderThan;
    activitiesFromCache = getIntervalResults.newActivities;
  }

  let reachedTheEnd: boolean | undefined;
  let activities: A[];
  if (activitiesFromCache) {
    activities = activitiesFromCache;
  } else {
    try {
      const response = await fetchActivities(currentOlderThan);
      reachedTheEnd = getReachedTheEnd?.(response);
      activities = getNewContractMatchItems(response);
      if (getAssetsMetadata) {
        assetsMetadata = getAssetsMetadata(response);
      }
      signal.throwIfAborted();

      try {
        await putNewActivities(activities, getAllNewItems(response), currentOlderThan);
      } catch (e) {
        console.error(e);
      }
    } catch (e) {
      console.error(e);
      const getIntervalResults = await getClosestNonEmptyActivitiesInterval({
        olderThan,
        getClosestActivitiesInterval,
        signal,
        canUseCachedInterval: () => true,
        getActivities,
        getNewOlderThan,
        isGenesisBlockPointer
      });
      currentOlderThan = getIntervalResults.currentOlderThan;
      activities = getIntervalResults.newActivities ?? [];
    }
  }

  signal.throwIfAborted();

  return { activities, assetsMetadata, reachedTheEnd };
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
    getNewContractMatchItems: response => response,
    isGenesisBlockPointer: pointer => Number(pointer) === 0,
    getActivities: interval => interval.activities,
    getNewOlderThan: interval => `${interval.oldestBlockHeight}`,
    canUseCachedInterval: (interval, currentOlderThan) => interval.newestBlockHeight === Number(currentOlderThan) - 1,
    putNewActivities: (activities, _, currentOlderThan) =>
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

interface FetchEtherlinkActivitiesWithCacheConfig extends Omit<FetchEvmActivitiesWithCacheConfig, 'olderThan'> {
  chainId: EtherlinkChainId;
  olderThan?: AllEtherlinkActivitiesPageParams;
}

export const fetchEtherlinkActivitiesWithCache = async ({
  chainId,
  accountAddress,
  assetSlug,
  signal,
  olderThan
}: FetchEtherlinkActivitiesWithCacheConfig) => {
  const contractAddress = assetSlug ? fromAssetSlug(assetSlug)[0] : undefined;

  return fetchActivitiesWithCache<
    AllEtherlinkActivitiesPageParams,
    GetEvmActivitiesIntervalResult,
    EvmActivity,
    EvmTokenMetadata | EvmCollectibleMetadata,
    {
      allActivities: EvmActivity[];
      nextPageParams: AllEtherlinkActivitiesPageParams;
      assetsMetadata: StringRecord<EvmTokenMetadata | EvmCollectibleMetadata>;
    }
  >({
    getClosestActivitiesInterval: currentOlderThan => {
      const blockNumber = getBlockNumberFromEtherlinkOlderThan(currentOlderThan);

      return getClosestEvmActivitiesInterval({
        olderThanBlockHeight: isDefined(blockNumber) ? `${blockNumber}` : undefined,
        chainId,
        account: accountAddress,
        contractAddress,
        maxItems: ETHERLINK_ITEMS_PER_PAGE
      });
    },
    fetchActivities: async currentOlderThan =>
      fetchEtherlinkActivities(currentOlderThan, chainId, accountAddress, signal),
    getAllNewItems: response => response.allActivities,
    getNewContractMatchItems: response =>
      contractAddress
        ? response.allActivities.filter(activity =>
            activity.operations.some(op => equalsIgnoreCase(op.asset?.contract, contractAddress))
          )
        : response.allActivities,
    getAssetsMetadata: response => response.assetsMetadata,
    getReachedTheEnd: ({ nextPageParams }) =>
      nextPageParams.operationsPageParams === null && nextPageParams.tokensTransfersPageParams === null,
    isGenesisBlockPointer: pointer => getBlockNumberFromEtherlinkOlderThan(pointer) === 0,
    getActivities: interval => interval.activities,
    getNewOlderThan: ({ activities }) => {
      // TODO: replace mock values
      if (activities.length === 0) {
        return {
          operationsPageParams: {
            block_number: 0,
            fee: '0',
            hash: '0x37628d45dcd6265c969aa5f5dc3fe8fddd21198c683b85ac7099d8e39597df50',
            index: 0,
            inserted_at: '2024-05-02T13:24:54.000Z',
            items_count: Number.MAX_SAFE_INTEGER,
            value: '0'
          },
          tokensTransfersPageParams: {
            block_number: 0,
            index: 0
          }
        };
      }

      const { blockHeight, hash, addedAt, operations } = activities.at(-1)!;
      const { logIndex } = operations.at(-1)!;

      return {
        operationsPageParams: {
          block_number: Number(blockHeight),
          fee: '0',
          hash,
          index: logIndex,
          inserted_at: addedAt,
          items_count: 0,
          value: '0'
        },
        tokensTransfersPageParams: {
          block_number: Number(blockHeight),
          index: logIndex
        }
      };
    },
    canUseCachedInterval: (interval, currentOlderThan) => {
      const blockNumber = getBlockNumberFromEtherlinkOlderThan(currentOlderThan);

      return isDefined(blockNumber) && interval.newestBlockHeight === blockNumber - 1;
    },
    putNewActivities: (_, allActivities, currentOlderThan) => {
      const blockNumber = getBlockNumberFromEtherlinkOlderThan(currentOlderThan);

      return putEvmActivities({
        activities: allActivities,
        chainId,
        account: accountAddress,
        olderThanBlockHeight: isDefined(blockNumber) ? `${blockNumber}` : undefined
      });
    },
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
      const alreadyKnownActivities = await getSeparateTezosActivities(chainId, accountAddress, hashes);
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
    getNewContractMatchItems: response => response,
    isGenesisBlockPointer: pointer => compareTezosIntervalLimits(tezosLowestIntervalLimit, pointer) === 0,
    getActivities: interval => interval.activities,
    getNewOlderThan: interval => interval.lowerLimit,
    canUseCachedInterval: (interval, currentOlderThan) =>
      compareTezosIntervalLimits(interval.upperLimit, currentOlderThan) === 0,
    putNewActivities: (activities, _, currentOlderThan) =>
      putTezosActivities({ activities, chainId, account: accountAddress, assetSlug, olderThan: currentOlderThan }),
    signal,
    olderThan
  });
