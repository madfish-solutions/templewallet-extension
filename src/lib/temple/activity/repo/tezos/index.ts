import { isDefined } from '@rnw-community/shared';
import { Collection } from 'dexie';
import { pick } from 'lodash';
import type { RequiredBy } from 'viem';

import { TezosActivity } from 'lib/activity';
import { TezosActivityOlderThan } from 'lib/activity/tezos/types';

import { DbTezosActivity, TezosActivitiesInterval, db, tezosActivities, tezosActivitiesIntervals } from '../db';

interface GetTezosActivitiesIntervalParams {
  olderThan?: TezosActivityOlderThan;
  chainId: string;
  account: string;
  assetSlug?: string;
  maxItems?: number;
}

export interface GetTezosActivitiesIntervalResult {
  activities: TezosActivity[];
  upperLimit: TezosActivityOlderThan;
  lowerLimit: TezosActivityOlderThan;
}

export const getIntervalLimit = (baseActivity: TezosActivityOlderThan, shift = 0) => {
  const { level: opLevel, timestamp } = baseActivity.oldestTzktOperation;
  const operationTs = new Date(timestamp).getTime() + 1000 * shift;

  return {
    hash: shift === 0 ? baseActivity.hash : '',
    oldestTzktOperation: {
      level: opLevel! + shift,
      timestamp: new Date(operationTs).toISOString().replace('.000', '')
    }
  };
};

export const compareLimits = (a: TezosActivityOlderThan, b: TezosActivityOlderThan) => {
  const { level: aLevel, timestamp: aTimestamp } = a.oldestTzktOperation;
  const { level: bLevel, timestamp: bTimestamp } = b.oldestTzktOperation;

  if (isDefined(aLevel) && isDefined(bLevel)) {
    return aLevel - bLevel;
  }

  return aTimestamp.localeCompare(bTimestamp);
};

const toFrontTezosActivity = ({ account, assetSlug, id, ...activity }: DbTezosActivity): TezosActivity => activity;

export const toDbTezosActivity = (activity: TezosActivity, assetSlug: string, account: string) => ({
  ...activity,
  assetSlug,
  account
});

const getPointerTimestamp = (pointer: TezosActivityOlderThan) => pointer.oldestTzktOperation.timestamp;

const lowerLimitTsPath = 'lowerLimit.oldestTzktOperation.timestamp' as const;
const upperLimitTsPath = 'upperLimit.oldestTzktOperation.timestamp' as const;
const activityTsPath = 'oldestTzktOperation.timestamp' as const;

export const lowestIntervalLimit = Object.freeze({
  hash: 'BLockGenesisGenesisGenesisGenesisGenesisf79b5d1CoW2',
  oldestTzktOperation: {
    level: 0,
    timestamp: '2018-06-30T16:07:32Z'
  }
});

export const getSeparateActivities = async (chainId: string, account: string, hashes: string[]) =>
  (
    await tezosActivities
      .where(['chainId', 'account', 'hash'])
      .anyOf(hashes.map(hash => [chainId, account, hash]))
      .toArray()
  ).map(toFrontTezosActivity);

export const getClosestTezosActivitiesInterval = async ({
  olderThan,
  chainId,
  account,
  assetSlug = '',
  maxItems = Infinity
}: GetTezosActivitiesIntervalParams): Promise<GetTezosActivitiesIntervalResult | undefined> =>
  db.transaction('r!', tezosActivities, tezosActivitiesIntervals, async () => {
    let allContractsIntervalsCollection: Collection<TezosActivitiesInterval>;
    let intervalsByContractCollection: Collection<TezosActivitiesInterval> | undefined;

    if (olderThan) {
      const olderThanTs = getPointerTimestamp(olderThan);
      allContractsIntervalsCollection = tezosActivitiesIntervals
        .where(['chainId', 'account', 'assetSlug', lowerLimitTsPath])
        .between([chainId, account, '', 0], [chainId, account, '', olderThanTs], true, false);
      intervalsByContractCollection = assetSlug
        ? tezosActivitiesIntervals
            .where(['chainId', 'account', 'assetSlug', lowerLimitTsPath])
            .between([chainId, account, assetSlug, 0], [chainId, account, assetSlug, olderThanTs], true, false)
        : undefined;
    } else {
      allContractsIntervalsCollection = tezosActivitiesIntervals.where({ chainId, account, assetSlug: '' });
      intervalsByContractCollection = assetSlug
        ? tezosActivitiesIntervals.where({ chainId, account, assetSlug })
        : undefined;
    }

    const allContractsIntervals = await allContractsIntervalsCollection.reverse().sortBy(upperLimitTsPath);
    const intervalsByContract = intervalsByContractCollection
      ? await intervalsByContractCollection.reverse().sortBy(upperLimitTsPath)
      : [];
    const interval =
      intervalsByContract[0] &&
      (!allContractsIntervals[0] ||
        compareLimits(intervalsByContract[0].upperLimit, allContractsIntervals[0].upperLimit) > 0)
        ? intervalsByContract[0]
        : allContractsIntervals[0];

    if (!interval) {
      return;
    }

    let lowerLimit = interval.lowerLimit;
    const { upperLimit, assetSlug: intervalAssetSlug } = interval;
    const searchUpperLimit = olderThan && compareLimits(olderThan, upperLimit) < 0 ? olderThan : upperLimit;
    const allRawActivitiesCollection = tezosActivities
      .where(['chainId', 'account', 'assetSlug', activityTsPath])
      .between(
        [chainId, account, intervalAssetSlug, getPointerTimestamp(lowerLimit)],
        [chainId, account, intervalAssetSlug, getPointerTimestamp(searchUpperLimit)],
        true,
        false
      )
      .reverse();
    let rawActivities: DbTezosActivity[];
    if (Number.isInteger(maxItems) && maxItems > 0) {
      rawActivities = await allRawActivitiesCollection.limit(maxItems).sortBy(activityTsPath);
      if (rawActivities.length > 0) {
        lowerLimit = getIntervalLimit(rawActivities.at(-1)!);
      }
    } else {
      rawActivities = await allRawActivitiesCollection.sortBy(activityTsPath);
    }

    return {
      activities: rawActivities
        .map(toFrontTezosActivity)
        .filter(activity => !assetSlug || activity.operations.some(op => op.assetSlug === assetSlug)),
      upperLimit: searchUpperLimit,
      lowerLimit
    };
  });

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
      const newOlderThan = newerAllContractsIntersectingInterval!.lowerLimit;

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

export const deleteTezosActivitiesByAddress = async (account: string) =>
  db.transaction('rw!', tezosActivities, tezosActivitiesIntervals, async () => {
    const intervalIds = await tezosActivitiesIntervals.where({ account }).primaryKeys();
    await tezosActivitiesIntervals.bulkDelete(intervalIds);
    const activitiesCollection = tezosActivities.where({ account });
    await deleteTezosActivities(activitiesCollection);
  });

const deleteTezosActivities = async (activitiesCollection: Collection<DbTezosActivity, number, DbTezosActivity>) => {
  const activitiesIds = await activitiesCollection.primaryKeys();
  await tezosActivities.bulkDelete(activitiesIds);
};
