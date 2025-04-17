import { isDefined } from '@rnw-community/shared';

import { VITALIK_ADDRESS } from 'lib/constants';

import {
  DbEvmActivity,
  DbEvmActivityAsset,
  EvmActivitiesInterval,
  evmActivities,
  evmActivitiesIntervals,
  evmActivityAssets
} from '../db';
import { omitId } from '../test-helpers';

import { toFrontEvmActivity } from './utils';

const getKey = (asset: Pick<DbEvmActivityAsset, 'contract' | 'tokenId'>) => `${asset.contract}_${asset.tokenId}`;

export const checkEvmDbState = async (
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

export const toEvmActivitiesForCertainContract = (
  activities: DbEvmActivity[],
  assets: Record<number, DbEvmActivityAsset>
) =>
  activities.map(activity => {
    const fkAsset = activity.operations[0]?.fkAsset;

    return {
      ...activity,
      contract: isDefined(fkAsset) ? assets[fkAsset].contract : ''
    };
  });

export const vitalikPkhLowercased = VITALIK_ADDRESS.toLowerCase() as HexString;
export const interactorPkh: HexString = '0xbe09893cafe9d2cc02a1ad60853f2c835c3056ae';
export const interactorPkhLowercased = interactorPkh.toLowerCase() as HexString;
