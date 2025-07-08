import { isDefined } from '@rnw-community/shared';
import { pick } from 'lodash';
import type { RequiredBy } from 'viem';

import { TezosActivity } from 'lib/activity';
import { TezosActivityOlderThan } from 'lib/activity/tezos/types';

import { TezosActivitiesInterval, db, tezosActivities, tezosActivitiesIntervals } from '../db';

import { deleteTezosActivities } from './delete';
import {
  activityTsPath,
  compareLimits,
  getIntervalLimit,
  getPointerTimestamp,
  lowerLimitTsPath,
  lowestIntervalLimit,
  toDbTezosActivity,
  upperLimitTsPath
} from './utils';

interface PutTezosActivitiesParams {
  activities: TezosActivity[];
  chainId: string;
  account: string;
  olderThan?: TezosActivityOlderThan;
  assetSlug?: string;
}

const toOlderThan = ({ hash, oldestTzktOperation }: TezosActivity): TezosActivityOlderThan => ({
  hash,
  oldestTzktOperation: pick(oldestTzktOperation, ['level', 'timestamp'])
});

/**
 * Puts Tezos activities into DB assuming that `activities` is a continuous history chunk. The function throws an error
 * if at least one activity is from a different chain than the specified one.
 */
export const putTezosActivities = async ({
  activities,
  chainId,
  account,
  olderThan,
  assetSlug = ''
}: PutTezosActivitiesParams): Promise<void> => {
  if (activities.some(({ chainId: activityChainId }) => activityChainId !== chainId)) {
    throw new Error('Activities from different chains are not allowed');
  }

  activities = activities.toSorted((a, b) => compareLimits(b, a));

  if (activities.length === 0 && !olderThan) {
    return;
  }

  olderThan = olderThan ?? getIntervalLimit(activities[0], 1);
  const oldestPointer = activities.length === 0 ? lowestIntervalLimit : toOlderThan(activities.at(-1)!);

  if (assetSlug) {
    return overwriteTezosActivitiesByAssetSlug({
      chainId,
      account,
      olderThan,
      oldestPointer,
      assetSlug,
      activities
    });
  }

  return overwriteTezosActivitiesForAllContracts({
    chainId,
    account,
    olderThan,
    oldestPointer,
    activities
  });
};

interface IntervalsManagementParams {
  chainId: string;
  account: string;
  assetSlug: string;
  olderThan: TezosActivityOlderThan;
  oldestPointer: TezosActivityOlderThan;
}

const maxTs = '9999-12-31T23:59:59.999Z';

const getSupersetInterval = async ({
  chainId,
  account,
  assetSlug,
  olderThan,
  oldestPointer
}: IntervalsManagementParams) =>
  tezosActivitiesIntervals
    .where(['chainId', 'account', 'assetSlug', upperLimitTsPath])
    .between(
      [chainId, account, assetSlug, getPointerTimestamp(olderThan)],
      [chainId, account, assetSlug, maxTs],
      true,
      false
    )
    .and(({ lowerLimit: intervalOldestPointer }) => compareLimits(intervalOldestPointer, oldestPointer) <= 0)
    .first();

const getSubsetIntervalsIds = async ({
  chainId,
  account,
  assetSlug,
  olderThan,
  oldestPointer
}: IntervalsManagementParams) =>
  tezosActivitiesIntervals
    .where(['chainId', 'account', 'assetSlug', lowerLimitTsPath])
    .between(
      [chainId, account, assetSlug, getPointerTimestamp(oldestPointer)],
      [chainId, account, assetSlug, getPointerTimestamp(olderThan)],
      true,
      false
    )
    .and(interval => compareLimits(interval.upperLimit, olderThan) <= 0)
    .primaryKeys();

const handleIntervalsJoins = async ({
  chainId,
  account,
  assetSlug,
  olderThan,
  oldestPointer
}: IntervalsManagementParams) => {
  const newerIntervalToJoinCollection = tezosActivitiesIntervals
    .where(['chainId', 'account', 'assetSlug', lowerLimitTsPath])
    .between(
      [chainId, account, assetSlug, getPointerTimestamp(oldestPointer)],
      [chainId, account, assetSlug, getPointerTimestamp(olderThan)],
      true,
      true
    );
  const newerIntervalToJoinId = (await newerIntervalToJoinCollection.primaryKeys()).at(0);
  const olderIntervalToJoinCollection = tezosActivitiesIntervals
    .where(['chainId', 'account', 'assetSlug', upperLimitTsPath])
    .between(
      [chainId, account, assetSlug, getPointerTimestamp(oldestPointer)],
      [chainId, account, assetSlug, getPointerTimestamp(olderThan)],
      true,
      false
    );
  const olderIntervalToJoinId = (await olderIntervalToJoinCollection.primaryKeys()).at(0);
  const newerIntervalToJoin = isDefined(newerIntervalToJoinId)
    ? await tezosActivitiesIntervals.get(newerIntervalToJoinId)
    : undefined;
  const olderIntervalToJoin = isDefined(olderIntervalToJoinId)
    ? await tezosActivitiesIntervals.get(olderIntervalToJoinId)
    : undefined;

  await tezosActivitiesIntervals.bulkDelete([newerIntervalToJoinId, olderIntervalToJoinId].filter(isDefined));
  await tezosActivitiesIntervals.add({
    chainId,
    account,
    assetSlug,
    upperLimit: newerIntervalToJoin ? newerIntervalToJoin.upperLimit : olderThan,
    lowerLimit: olderIntervalToJoin ? olderIntervalToJoin.lowerLimit : oldestPointer
  });
};

const filterRelevantActivities = (
  activities: TezosActivity[],
  olderThan: TezosActivityOlderThan,
  oldestPointer: TezosActivityOlderThan
) =>
  activities.filter(activity => compareLimits(activity, olderThan) < 0 && compareLimits(activity, oldestPointer) >= 0);

type OverwriteTezosActivitiesByContractParams = RequiredBy<PutTezosActivitiesParams, 'assetSlug' | 'olderThan'> & {
  oldestPointer: TezosActivityOlderThan;
  createTransaction?: boolean;
  counter?: number;
};
const overwriteTezosActivitiesByAssetSlug = async ({
  activities,
  chainId,
  account,
  olderThan,
  oldestPointer,
  assetSlug,
  createTransaction = true,
  counter = 0
}: OverwriteTezosActivitiesByContractParams): Promise<void> => {
  if (counter >= 5) {
    throw new Error('overwriteTezosActivitiesByAssetSlug counter exceeded');
  }

  const doOperations = async () => {
    const olderThanTs = getPointerTimestamp(olderThan);
    const oldestPointerTs = getPointerTimestamp(oldestPointer);
    const supersetAllContractsInterval = await getSupersetInterval({
      chainId,
      account,
      assetSlug: '',
      olderThan,
      oldestPointer
    });

    if (supersetAllContractsInterval) {
      return;
    }

    const activitiesToDeleteCollection = tezosActivities
      .where(['chainId', 'account', 'assetSlug', activityTsPath])
      .between([chainId, account, assetSlug, oldestPointerTs], [chainId, account, assetSlug, olderThanTs], true, false);
    await deleteTezosActivities(activitiesToDeleteCollection);

    const supersetInterval = await getSupersetInterval({
      chainId,
      account,
      assetSlug,
      olderThan,
      oldestPointer
    });

    if (supersetInterval) {
      return insertActivities({ activities, account, assetSlug });
    }

    const subsetIntervalsIds = await getSubsetIntervalsIds({
      chainId,
      account,
      assetSlug,
      olderThan,
      oldestPointer
    });
    await tezosActivitiesIntervals.bulkDelete(subsetIntervalsIds);

    const allContractsSubsetIntervalsIds = await getSubsetIntervalsIds({
      chainId,
      account,
      assetSlug: '',
      olderThan,
      oldestPointer
    });

    if (allContractsSubsetIntervalsIds.length > 0) {
      const allContractsSubsetIntervals = (await tezosActivitiesIntervals.bulkGet(
        allContractsSubsetIntervalsIds
      )) as TezosActivitiesInterval[];
      allContractsSubsetIntervals.sort((a, b) => compareLimits(b.upperLimit, a.upperLimit));
      for (let i = 0; i <= allContractsSubsetIntervalsIds.length; i++) {
        const newIntervalOlderThan = i === 0 ? olderThan : allContractsSubsetIntervals[i - 1].lowerLimit;
        const newIntervalOldestPointer =
          i === allContractsSubsetIntervalsIds.length ? oldestPointer : allContractsSubsetIntervals[i].upperLimit;
        if (compareLimits(newIntervalOlderThan, newIntervalOldestPointer) > 0) {
          await overwriteTezosActivitiesByAssetSlug({
            chainId,
            account,
            olderThan: newIntervalOlderThan,
            oldestPointer: newIntervalOldestPointer,
            assetSlug,
            createTransaction: false,
            activities: filterRelevantActivities(activities, newIntervalOlderThan, newIntervalOldestPointer),
            counter: counter + 1
          });
        }
      }

      return;
    }

    const newerAllContractsIntersectingInterval = await tezosActivitiesIntervals
      .where(['chainId', 'account', 'assetSlug', lowerLimitTsPath])
      .between([chainId, account, '', oldestPointerTs], [chainId, account, '', olderThanTs], true, false)
      .first();

    if (newerAllContractsIntersectingInterval) {
      const newOlderThan = newerAllContractsIntersectingInterval.lowerLimit;

      return overwriteTezosActivitiesByAssetSlug({
        chainId,
        account,
        olderThan: newOlderThan,
        oldestPointer,
        assetSlug,
        createTransaction: false,
        activities: filterRelevantActivities(activities, newOlderThan, oldestPointer),
        counter: counter + 1
      });
    }

    const olderAllContractsIntersectingInterval = await tezosActivitiesIntervals
      .where(['chainId', 'account', 'assetSlug', upperLimitTsPath])
      .between([chainId, account, '', oldestPointerTs], [chainId, account, '', olderThanTs], false, false)
      .first();

    if (isDefined(olderAllContractsIntersectingInterval)) {
      const newOldestPointer = olderAllContractsIntersectingInterval.upperLimit;

      return overwriteTezosActivitiesByAssetSlug({
        chainId,
        account,
        olderThan,
        oldestPointer: newOldestPointer,
        assetSlug,
        createTransaction: false,
        activities: filterRelevantActivities(activities, olderThan, newOldestPointer),
        counter: counter + 1
      });
    }

    await handleIntervalsJoins({
      chainId,
      account,
      assetSlug,
      olderThan,
      oldestPointer
    });
    console.log('handleIntervalsJoins', activities)
    await insertActivities({ activities, account, assetSlug });
  };

  return createTransaction
    ? db.transaction('rw!', tezosActivitiesIntervals, tezosActivities, doOperations)
    : doOperations();
};

type OverwriteTezosActivitiesForAllContractsParams = RequiredBy<
  Omit<PutTezosActivitiesParams, 'assetSlug'>,
  'olderThan'
> & { oldestPointer?: TezosActivityOlderThan };
const overwriteTezosActivitiesForAllContracts = ({
  activities,
  chainId,
  account,
  olderThan,
  oldestPointer = lowestIntervalLimit
}: OverwriteTezosActivitiesForAllContractsParams) =>
  db.transaction('rw!', tezosActivitiesIntervals, tezosActivities, async () => {
    const olderThanTs = getPointerTimestamp(olderThan);
    const oldestPointerTs = getPointerTimestamp(oldestPointer);
    const activitiesToDeleteCollection = tezosActivities
      .where(['chainId', 'account', activityTsPath])
      .between([chainId, account, oldestPointerTs], [chainId, account, olderThanTs], true, false);
    await deleteTezosActivities(activitiesToDeleteCollection);
    await insertActivities({ activities, account, assetSlug: '' });

    const supersetAllContractsInterval = await getSupersetInterval({
      chainId,
      account,
      assetSlug: '',
      olderThan,
      oldestPointer
    });

    if (supersetAllContractsInterval) {
      return;
    }

    const supersetIntervalsIds = await tezosActivitiesIntervals
      .where(['chainId', 'account', lowerLimitTsPath])
      .between(
        [chainId, account, getPointerTimestamp(lowestIntervalLimit)],
        [chainId, account, olderThanTs],
        true,
        false
      )
      .and(({ upperLimit: intervalUpperLimit }) => getPointerTimestamp(intervalUpperLimit) >= olderThanTs)
      .primaryKeys();

    if (supersetIntervalsIds.length > 0) {
      const supersetIntervals = await tezosActivitiesIntervals.bulkGet(supersetIntervalsIds);
      await tezosActivitiesIntervals.bulkDelete(supersetIntervalsIds);
      await tezosActivitiesIntervals.bulkAdd(
        supersetIntervals
          .map(interval => {
            const { upperLimit: supersetUpperLimit, lowerLimit: supersetLowerLimit, id, ...restProps } = interval!;

            return [
              {
                ...restProps,
                upperLimit: supersetUpperLimit,
                lowerLimit: olderThan
              },
              {
                ...restProps,
                upperLimit: oldestPointer,
                lowerLimit: supersetLowerLimit
              }
            ];
          })
          .flat()
          .filter(({ upperLimit, lowerLimit }) => compareLimits(upperLimit, lowerLimit) > 0)
      );
    }

    const subsetIntervalsIds = await tezosActivitiesIntervals
      .where(['chainId', 'account', lowerLimitTsPath])
      .between([chainId, account, oldestPointerTs], [chainId, account, olderThanTs], true, false)
      .and(interval => getPointerTimestamp(interval.upperLimit) < olderThanTs)
      .primaryKeys();
    await tezosActivitiesIntervals.bulkDelete(subsetIntervalsIds);

    await tezosActivitiesIntervals
      .where(['chainId', 'account', lowerLimitTsPath])
      .between([chainId, account, oldestPointerTs], [chainId, account, olderThanTs], true, false)
      .and(interval => interval.assetSlug !== '')
      .modify({ lowerLimit: olderThan });

    await tezosActivitiesIntervals
      .where(['chainId', 'account', upperLimitTsPath])
      .between([chainId, account, oldestPointerTs], [chainId, account, olderThanTs], true, false)
      .and(interval => interval.assetSlug !== '')
      .modify({ upperLimit: oldestPointer });

    await handleIntervalsJoins({
      chainId,
      account,
      assetSlug: '',
      olderThan,
      oldestPointer
    });
  });

interface InsertActivitiesParams {
  activities: TezosActivity[];
  account: string;
  assetSlug: string;
}

const insertActivities = async ({ activities, account, assetSlug }: InsertActivitiesParams) => {
  await tezosActivities.bulkAdd(activities.map(activity => toDbTezosActivity(activity, assetSlug, account)));
};
