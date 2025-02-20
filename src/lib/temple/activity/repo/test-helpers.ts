import { omit } from 'lodash';

import {
  DbEvmActivity,
  DbEvmActivityAsset,
  EvmActivitiesInterval,
  db,
  evmActivities,
  evmActivitiesIntervals,
  evmActivityAssets
} from './db';
import { toFrontEvmActivity } from './evm';

export const resetDb = async () => {
  await db.delete();
  await db.open();
};

const getKey = (asset: Pick<DbEvmActivityAsset, 'contract' | 'tokenId'>) => `${asset.contract}_${asset.tokenId}`;
const omitId = <T extends { id?: number }>(obj: T) => omit(obj, 'id');

export const checkDbState = async (
  expectedIntervals: EvmActivitiesInterval[],
  expectedActivitiesWithInitialAssetsIds: DbEvmActivity[],
  expectedAssetsWithInitialIds: Record<number, DbEvmActivityAsset>
) => {
  const expectedAssets = Object.values(expectedAssetsWithInitialIds).sort((a, b) => getKey(a).localeCompare(getKey(b)));
  const expectedActivities = expectedActivitiesWithInitialAssetsIds.map(activity =>
    toFrontEvmActivity(activity, expectedAssetsWithInitialIds)
  );
  const actualIntervals = (await evmActivitiesIntervals.toArray()).map(omitId);
  const actualAssetsIds = await evmActivityAssets.toCollection().primaryKeys();
  const actualAssets = await evmActivityAssets.bulkGet(actualAssetsIds);
  const sortedActualAssets = actualAssets.toSorted((a, b) => getKey(a!).localeCompare(getKey(b!)));
  const actualAssetsWithIds = Object.fromEntries(actualAssets.map((asset, i) => [actualAssetsIds[i], omitId(asset!)]));
  const actualDbActivities = await evmActivities.toArray();
  const actualActivities = actualDbActivities.map(activity => toFrontEvmActivity(activity, actualAssetsWithIds));

  expect(actualIntervals).toEqual(expectedIntervals.map(omitId));
  expect(sortedActualAssets.map(asset => omitId(asset!))).toEqual(expectedAssets.map(asset => omitId(asset!)));
  expect(actualActivities).toEqual(expectedActivities);
};
