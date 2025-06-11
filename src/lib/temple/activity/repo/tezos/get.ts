import { Collection } from 'dexie';

import { TezosActivity } from 'lib/activity';
import { TezosActivityOlderThan } from 'lib/activity/tezos/types';

import { DbTezosActivity, TezosActivitiesInterval, db, tezosActivities, tezosActivitiesIntervals } from '../db';

import {
  activityTsPath,
  compareLimits,
  getIntervalLimit,
  getPointerTimestamp,
  lowerLimitTsPath,
  toFrontTezosActivity,
  upperLimitTsPath
} from './utils';

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
